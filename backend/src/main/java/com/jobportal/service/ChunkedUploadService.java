package com.jobportal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ChunkedUploadService {

    @Value("${app.storage.local.upload-dir:./uploads}")
    private String uploadDir;

    private final ConcurrentHashMap<String, UploadSession> sessions = new ConcurrentHashMap<>();

    public record UploadSession(
            String uploadId,
            int totalChunks,
            String originalFilename,
            Path tempDir,
            Set<Integer> receivedChunks) {}

    public String initUpload(String originalFilename, int totalChunks) {
        String uploadId = UUID.randomUUID().toString();
        Path tempDir = Paths.get(uploadDir, "chunks", uploadId);
        try {
            Files.createDirectories(tempDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create temp directory: " + e.getMessage());
        }
        sessions.put(uploadId, new UploadSession(uploadId, totalChunks, originalFilename, tempDir,
                ConcurrentHashMap.newKeySet()));
        log.info("Chunked upload initiated: uploadId={}, totalChunks={}, file={}", uploadId, totalChunks, originalFilename);
        return uploadId;
    }

    public int uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        UploadSession session = sessions.get(uploadId);
        if (session == null) throw new IllegalArgumentException("Upload session not found: " + uploadId);

        Path chunkPath = session.tempDir().resolve(String.format("chunk_%06d", chunkIndex));
        try {
            chunk.transferTo(chunkPath.toAbsolutePath());
            session.receivedChunks().add(chunkIndex);
            log.debug("Chunk {}/{} received for upload {}", chunkIndex + 1, session.totalChunks(), uploadId);
            return session.receivedChunks().size();
        } catch (IOException e) {
            throw new RuntimeException("Failed to save chunk " + chunkIndex + ": " + e.getMessage());
        }
    }

    public String finalizeUpload(String uploadId, String targetKey) {
        UploadSession session = sessions.get(uploadId);
        if (session == null) throw new IllegalArgumentException("Upload session not found: " + uploadId);
        if (session.receivedChunks().size() != session.totalChunks()) {
            throw new IllegalStateException(
                    "Not all chunks received. Expected " + session.totalChunks()
                            + ", got " + session.receivedChunks().size());
        }

        Path targetPath = Paths.get(uploadDir).resolve(targetKey);
        try {
            Files.createDirectories(targetPath.getParent());
            try (OutputStream out = Files.newOutputStream(targetPath)) {
                for (int i = 0; i < session.totalChunks(); i++) {
                    Path chunkPath = session.tempDir().resolve(String.format("chunk_%06d", i));
                    Files.copy(chunkPath, out);
                }
            }
            Files.walk(session.tempDir())
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException ignored) {}
                    });
            log.info("Chunked upload finalized: {} -> {}", uploadId, targetPath.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Failed to assemble video: " + e.getMessage());
        }

        sessions.remove(uploadId);
        return "/uploads/" + targetKey;
    }
}

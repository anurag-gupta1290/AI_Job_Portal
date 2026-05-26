package com.jobportal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final List<String> ALLOWED_RESUME_TYPES = List.of(
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final long MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

    // ── Killswitch ────────────────────────────────────────────────
    /** true  → upload to S3  |  false → write to local disk */
    @Value("${app.storage.use-s3:false}")
    private boolean useS3;

    @Value("${app.storage.local.upload-dir:./uploads}")
    private String localUploadDir;

    // ── AWS config (only used when useS3=true) ────────────────────
    @Value("${app.aws.region}")
    private String awsRegion;

    @Value("${app.aws.s3.bucket}")
    private String bucket;

    @Value("${app.aws.access-key}")
    private String accessKey;

    @Value("${app.aws.secret-key}")
    private String secretKey;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (useS3) {
            s3Client = S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
            log.info("File storage: S3 bucket '{}'", bucket);
        } else {
            log.info("File storage: local directory '{}'", Paths.get(localUploadDir).toAbsolutePath());
        }
    }

    // ── Public API ────────────────────────────────────────────────

    public String uploadResume(MultipartFile file, Long userId) {
        validateResume(file);
        String ext = getExtension(file.getOriginalFilename());
        String key = String.format("resumes/%d/%s.%s", userId, UUID.randomUUID(), ext);
        return storeFile(file, key);
    }

    public String uploadCourseThumbnail(MultipartFile file, Long courseId) {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > 5 * 1024 * 1024) throw new IllegalArgumentException("Thumbnail exceeds 5 MB limit");
        String ext = getExtension(file.getOriginalFilename());
        String key = String.format("thumbnails/%d/%s.%s", courseId, UUID.randomUUID(), ext);
        return storeFile(file, key);
    }

    public String uploadLessonVideo(MultipartFile file, Long courseId, Long lessonId) {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > 500L * 1024 * 1024) throw new IllegalArgumentException("Video exceeds 500 MB limit");
        String ext = getExtension(file.getOriginalFilename());
        String key = String.format("videos/%d/%d/%s.%s", courseId, lessonId, UUID.randomUUID(), ext);
        return storeFile(file, key);
    }

    public String uploadCompanyLogo(MultipartFile file, Long companyId) {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > 2 * 1024 * 1024) throw new IllegalArgumentException("Logo exceeds 2 MB limit");
        String ext = getExtension(file.getOriginalFilename());
        String key = String.format("logos/%d/%s.%s", companyId, UUID.randomUUID(), ext);
        return storeFile(file, key);
    }

    public void deleteFile(String fileUrl) {
        if (useS3) {
            deleteFromS3(fileUrl);
        } else {
            deleteFromLocal(fileUrl);
        }
    }

    // ── Routing ───────────────────────────────────────────────────

    private String storeFile(MultipartFile file, String key) {
        return useS3 ? uploadToS3(file, key) : uploadToLocal(file, key);
    }

    // ── S3 ────────────────────────────────────────────────────────

    private String uploadToS3(MultipartFile file, String key) {
        try {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build(),
                RequestBody.fromBytes(file.getBytes())
            );
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, awsRegion, key);
        } catch (Exception e) {
            log.error("S3 upload failed for key {}: {}", key, e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    private void deleteFromS3(String fileUrl) {
        try {
            String key = fileUrl.substring(fileUrl.indexOf(".com/") + 5);
            s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
            log.info("Deleted S3 file: {}", key);
        } catch (Exception e) {
            log.warn("Failed to delete S3 file: {}", e.getMessage());
        }
    }

    // ── Local disk ────────────────────────────────────────────────

    private String uploadToLocal(MultipartFile file, String key) {
        try {
            Path target = Paths.get(localUploadDir).resolve(key);
            Files.createDirectories(target.getParent());
            file.transferTo(target.toAbsolutePath());
            log.info("Saved file locally: {}", target.toAbsolutePath());
            return "/uploads/" + key;
        } catch (IOException e) {
            log.error("Local upload failed for key {}: {}", key, e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    private void deleteFromLocal(String fileUrl) {
        try {
            // strip the /uploads/ prefix to recover the key
            String key = fileUrl.startsWith("/api/uploads/") ? fileUrl.substring("/api/uploads/".length())
                       : fileUrl.startsWith("/uploads/") ? fileUrl.substring("/uploads/".length()) : fileUrl;
            Path target = Paths.get(localUploadDir).resolve(key);
            Files.deleteIfExists(target);
            log.info("Deleted local file: {}", target.toAbsolutePath());
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    private void validateResume(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_RESUME_SIZE) {
            throw new IllegalArgumentException("Resume exceeds 5 MB limit");
        }
        if (!ALLOWED_RESUME_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only PDF and DOCX files are accepted");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
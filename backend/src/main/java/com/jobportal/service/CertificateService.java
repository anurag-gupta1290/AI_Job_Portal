package com.jobportal.service;

import com.jobportal.dto.response.CertificateResponse;
import com.jobportal.entity.Certificate;
import com.jobportal.entity.Enrolment;
import com.jobportal.exception.BusinessException;
import com.jobportal.repository.CertificateRepository;
import com.jobportal.repository.EnrolmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrolmentRepository enrolmentRepository;

    @Value("${app.storage.local.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public CertificateResponse getOrGenerate(Long enrolmentId) {
        return certificateRepository.findByEnrolmentId(enrolmentId)
                .map(this::toResponse)
                .orElseGet(() -> toResponse(generate(enrolmentId)));
    }

    @Transactional
    public Certificate generateForEnrolment(Enrolment enrolment) {
        if (certificateRepository.findByEnrolmentId(enrolment.getId()).isPresent()) {
            return certificateRepository.findByEnrolmentId(enrolment.getId()).get();
        }
        return generate(enrolment.getId());
    }

    private Certificate generate(Long enrolmentId) {
        Enrolment enrolment = enrolmentRepository.findById(enrolmentId)
                .orElseThrow(() -> BusinessException.notFound("Enrolment not found"));
        if (enrolment.getCompletedAt() == null) {
            throw BusinessException.badRequest("Course not yet completed");
        }

        String certNumber = "CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String key = "certificates/" + enrolmentId + "/" + certNumber + ".pdf";

        try {
            byte[] pdfBytes = buildPdf(certNumber, enrolment);
            Path target = Paths.get(uploadDir).resolve(key);
            Files.createDirectories(target.getParent());
            Files.write(target, pdfBytes);
            log.info("Certificate generated: {}", target.toAbsolutePath());
        } catch (IOException e) {
            log.error("Certificate PDF generation failed for enrolment {}: {}", enrolmentId, e.getMessage());
            throw new RuntimeException("Certificate generation failed: " + e.getMessage());
        }

        Certificate cert = Certificate.builder()
                .enrolment(enrolment)
                .certificateNumber(certNumber)
                .seekerName(enrolment.getSeeker().getFullName())
                .courseTitle(enrolment.getCourse().getTitle())
                .trainerName(enrolment.getCourse().getTrainer().getFullName())
                .fileUrl("/uploads/" + key)
                .build();
        return certificateRepository.save(cert);
    }

    private byte[] buildPdf(String certNumber, Enrolment enrolment) throws IOException {
        // Landscape A4: width=842, height=595
        PDRectangle landscape = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(landscape);
            doc.addPage(page);

            float W = landscape.getWidth();
            float H = landscape.getHeight();

            PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDFont oblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

                // cream background
                cs.setNonStrokingColor(0.98f, 0.96f, 0.90f);
                cs.addRect(0, 0, W, H);
                cs.fill();

                // outer gold border
                cs.setStrokingColor(0.60f, 0.40f, 0.10f);
                cs.setLineWidth(5);
                cs.addRect(18, 18, W - 36, H - 36);
                cs.stroke();

                // inner thin border
                cs.setLineWidth(1.5f);
                cs.addRect(28, 28, W - 56, H - 56);
                cs.stroke();

                // heading
                cs.setNonStrokingColor(0.20f, 0.20f, 0.20f);
                centeredText(cs, bold, 38, "Certificate of Completion", W, H - 110);

                // decorative rule
                cs.setStrokingColor(0.60f, 0.40f, 0.10f);
                cs.setLineWidth(1);
                cs.moveTo(W / 2f - 200, H - 130);
                cs.lineTo(W / 2f + 200, H - 130);
                cs.stroke();

                // "This certifies that"
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                centeredText(cs, regular, 15, "This certifies that", W, H - 175);

                // Seeker name
                cs.setNonStrokingColor(0.10f, 0.30f, 0.60f);
                centeredText(cs, bold, 30, enrolment.getSeeker().getFullName(), W, H - 225);

                // "has successfully completed"
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                centeredText(cs, regular, 15, "has successfully completed the course", W, H - 270);

                // Course title
                cs.setNonStrokingColor(0.10f, 0.30f, 0.60f);
                centeredText(cs, bold, 24, enrolment.getCourse().getTitle(), W, H - 320);

                // Trainer & date line
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                String completedDate = enrolment.getCompletedAt().toLocalDate().toString();
                centeredText(cs, oblique, 13,
                        "Delivered by " + enrolment.getCourse().getTrainer().getFullName()
                                + "  ·  Completed on " + completedDate,
                        W, H - 365);

                // bottom decorative rule
                cs.setStrokingColor(0.60f, 0.40f, 0.10f);
                cs.moveTo(W / 2f - 200, H - 385);
                cs.lineTo(W / 2f + 200, H - 385);
                cs.stroke();

                // Certificate number (small, bottom)
                cs.setNonStrokingColor(0.50f, 0.50f, 0.50f);
                centeredText(cs, regular, 10, "Certificate No: " + certNumber, W, 42);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private void centeredText(PDPageContentStream cs, PDFont font, float size, String text,
            float pageWidth, float y) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000f * size;
        float x = (pageWidth - textWidth) / 2f;
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    public CertificateResponse toResponse(Certificate c) {
        return new CertificateResponse(
                c.getId(),
                c.getEnrolment().getId(),
                c.getCertificateNumber(),
                c.getSeekerName(),
                c.getCourseTitle(),
                c.getTrainerName(),
                c.getIssuedAt(),
                c.getFileUrl());
    }
}

package com.campusclubs.service.impl;

import com.campusclubs.dto.request.AdminRequests.*;
import com.campusclubs.entity.nosql.Club;
import com.campusclubs.entity.sql.ActivityLog;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.exception.ResourceNotFoundException;
import com.campusclubs.repository.nosql.ClubRepository;
import com.campusclubs.repository.nosql.EventRepository;
import com.campusclubs.repository.nosql.PostRepository;
import com.campusclubs.repository.sql.ActivityLogRepository;
import com.campusclubs.repository.sql.UserRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository        userRepo;
    private final ClubRepository        clubRepo;
    private final EventRepository       eventRepo;
    private final PostRepository        postRepo;
    private final ActivityLogRepository logRepo;
    private final PasswordEncoder       encoder;
    private final AuthService           authService;

    // ── Users ──────────────────────────────────────────────────────────────
    public List<User> getAllUsers()             { return userRepo.findAll(); }
    public List<User> getActiveUsers()         { return userRepo.findByActiveTrue(); }

    @Transactional
    public User createUser(CreateUserRequest req) {
        String password = authService.decodeClientSecret(req.getPassword());
        authService.validatePassword(password);
        if (userRepo.existsByEmail(req.getEmail()))
            throw new BadRequestException("Email already registered");
        User.Role role = User.Role.valueOf(req.getRole().toUpperCase());
        User user = User.builder()
                .name(req.getName()).email(req.getEmail())
                .passwordHash(encoder.encode(password))
                .studentId(req.getStudentId()).role(role)
                .department(req.getDepartment()).year(req.getYear())
                .phone(req.getPhone()).skills(req.getSkills())
                .bio(req.getBio()).active(true).build();
        return userRepo.save(user);
    }

    @Transactional
    public User updateRole(Long userId, UpdateUserRoleRequest req) {
        User user = findUser(userId);
        user.setRole(User.Role.valueOf(req.getRole().toUpperCase()));
        return userRepo.save(user);
    }

    @Transactional
    public User toggleStatus(Long userId) {
        User user = findUser(userId);
        user.setActive(!user.isActive());
        return userRepo.save(user);
    }

    // ── Activity logs ──────────────────────────────────────────────────────
    public List<ActivityLog> getRecentLogs(int limit) {
        return logRepo.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    // ── Analytics ──────────────────────────────────────────────────────────
    public Map<String,Object> getDashboardStats() {
        Map<String,Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",     userRepo.count());
        stats.put("activeClubs",    clubRepo.findByActiveTrue().size());
        stats.put("totalEvents",    eventRepo.count());
        stats.put("pendingEvents",  eventRepo.findByStatus("PENDING").size());
        stats.put("totalPosts",     postRepo.count());

        Map<String,Long> roleBreak = new LinkedHashMap<>();
        for (User.Role r : User.Role.values()) {
            roleBreak.put(r.name().toLowerCase(), (long) userRepo.findByRole(r).size());
        }
        stats.put("roleBreakdown", roleBreak);
        return stats;
    }

    public Map<String,Object> getClubAnalytics(String clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
        long total  = eventRepo.countByClub_ClubId(clubId);
        long approv = eventRepo.countByClub_ClubIdAndStatus(clubId, "APPROVED");
        long regs   = eventRepo.findByClub_ClubId(clubId).stream()
                .mapToLong(e -> e.getRegistrations().size()).sum();
        long posts  = postRepo.findByClubId(clubId).size();
        long likes  = postRepo.findByClubId(clubId).stream()
                .mapToLong(p -> p.getLikes().size()).sum();

        return Map.of(
                "clubId", clubId, "clubName", club.getName(),
                "memberCount", club.getMembers().size(),
                "totalEvents", total, "approvedEvents", approv,
                "totalRegistrations", regs, "totalPosts", posts, "totalLikes", likes
        );
    }

    // ── PDF Report ─────────────────────────────────────────────────────────
    public byte[] generateClubPdfReport(String clubId) throws Exception {
        Map<String,Object> analytics = getClubAnalytics(clubId);
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found"));

        Document doc = new Document(PageSize.A4, 60, 60, 70, 60);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, bos);
        doc.open();

        // Title
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, BaseColor.BLACK);
        Font headFont  = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD);
        Font bodyFont  = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL);
        Font mutedFont = new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC, BaseColor.GRAY);

        doc.add(new Paragraph("CampusClubs — Club Performance Report", titleFont));
        doc.add(new Paragraph("Generated: " + LocalDateTime.now(), mutedFont));
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Club: " + club.getName(), headFont));
        doc.add(new Paragraph("Category: " + club.getCategory(), bodyFont));
        doc.add(new Paragraph("Founded: " + club.getFoundedYear(), bodyFont));
        doc.add(Chunk.NEWLINE);

        // Stats table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(80);
        addTableRow(table, "Total Members",       analytics.get("memberCount").toString(), headFont, bodyFont);
        addTableRow(table, "Total Events",        analytics.get("totalEvents").toString(),  headFont, bodyFont);
        addTableRow(table, "Approved Events",     analytics.get("approvedEvents").toString(), headFont, bodyFont);
        addTableRow(table, "Total Registrations", analytics.get("totalRegistrations").toString(), headFont, bodyFont);
        addTableRow(table, "Total Posts",         analytics.get("totalPosts").toString(),   headFont, bodyFont);
        addTableRow(table, "Total Likes",         analytics.get("totalLikes").toString(),   headFont, bodyFont);
        doc.add(table);

        doc.add(Chunk.NEWLINE);

        // Members list
        doc.add(new Paragraph("Current Members", headFont));
        club.getMembers().forEach(m -> {
            try { doc.add(new Paragraph("  • " + m.getName() + " (" + m.getStudentId() + ") — " + m.getEmail(), bodyFont)); }
            catch (Exception ignored) {}
        });

        doc.add(Chunk.NEWLINE);

        // Events list
        doc.add(new Paragraph("Events", headFont));
        eventRepo.findByClub_ClubId(clubId).forEach(e -> {
            try { doc.add(new Paragraph("  • [" + e.getStatus() + "] " + e.getTitle() + " — " + e.getCategory(), bodyFont)); }
            catch (Exception ignored) {}
        });

        doc.close();
        return bos.toByteArray();
    }

    private void addTableRow(PdfPTable table, String key, String value, Font keyFont, Font valFont) {
        PdfPCell k = new PdfPCell(new Phrase(key, keyFont));
        PdfPCell v = new PdfPCell(new Phrase(value, valFont));
        k.setBorder(Rectangle.NO_BORDER); v.setBorder(Rectangle.NO_BORDER);
        k.setPaddingBottom(6); v.setPaddingBottom(6);
        table.addCell(k); table.addCell(v);
    }

    private User findUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}

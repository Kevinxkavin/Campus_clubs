package com.campusclubs;

import com.campusclubs.dto.request.ClubRequests.JoinClubRequest;
import com.campusclubs.entity.nosql.Club;
import com.campusclubs.entity.sql.User;
import com.campusclubs.exception.BadRequestException;
import com.campusclubs.repository.nosql.ClubRepository;
import com.campusclubs.repository.sql.UserRepository;
import com.campusclubs.service.impl.ClubService;
import com.campusclubs.service.impl.NotificationService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClubService unit tests")
class ClubServiceTest {

    @Mock ClubRepository      clubRepo;
    @Mock UserRepository      userRepo;
    @Mock NotificationService notifService;

    @InjectMocks ClubService clubService;

    Club mockClub() {
        // members/pendingMembers/eventChairs use @Builder.Default → already empty lists
        return Club.builder()
                .id("c1")
                .name("Coding Club")
                .category("Technical")
                .foundedYear(2022)
                .active(true)
                .build();
    }

    User mockUser(Long id) {
        return User.builder().id(id).name("Kavin").email("kavin@campus.edu")
                .studentId("2024CS001").role(User.Role.STUDENT).active(true).build();
    }

    @Test
    @DisplayName("requestJoin – new user gets added to pendingMembers")
    void requestJoin_success() {
        Club club = mockClub();
        User user = mockUser(1L);
        JoinClubRequest req = new JoinClubRequest("CS", "2nd Year", "9000000004",
                "Java", "I love coding", "Built a chat app");

        when(clubRepo.findById("c1")).thenReturn(Optional.of(club));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(clubRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        clubService.requestJoin("c1", 1L, req);

        assertEquals(1, club.getPendingMembers().size());
        assertEquals(1L, club.getPendingMembers().get(0).getUserId());
    }

    @Test
    @DisplayName("requestJoin – already a member throws BadRequestException")
    void requestJoin_alreadyMember() {
        Club club = mockClub();
        club.getMembers().add(Club.MemberRef.builder().userId(1L).name("Kavin").build());
        User user = mockUser(1L);
        JoinClubRequest req = new JoinClubRequest("CS", "2nd Year", "", "", "Love it", "");

        when(clubRepo.findById("c1")).thenReturn(Optional.of(club));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> clubService.requestJoin("c1", 1L, req));
    }

    @Test
    @DisplayName("approveMember – moves from pending to members")
    void approveMember_success() {
        Club club = mockClub();
        club.getPendingMembers().add(
                Club.JoinRequest.builder().userId(2L).name("Priya").email("priya@campus.edu")
                        .studentId("2024CS002").build());
        User user = mockUser(2L);

        when(clubRepo.findById("c1")).thenReturn(Optional.of(club));
        when(userRepo.findById(2L)).thenReturn(Optional.of(user));
        when(clubRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        clubService.approveMember("c1", 2L);

        assertEquals(0, club.getPendingMembers().size());
        assertEquals(1, club.getMembers().size());
        assertEquals(2L, club.getMembers().get(0).getUserId());
    }

    @Test
    @DisplayName("removeMember – member removed and event chairs cleaned up")
    void removeMember_success() {
        Club club = mockClub();
        club.getMembers().add(Club.MemberRef.builder().userId(1L).name("Kavin").build());
        club.getEventChairs().add(Club.EventChairAssignment.builder()
                .userId(1L).name("Kavin").eventId("e1").build());

        when(clubRepo.findById("c1")).thenReturn(Optional.of(club));
        when(userRepo.findById(1L)).thenReturn(Optional.of(mockUser(1L)));
        when(clubRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        clubService.removeMember("c1", 1L);

        assertEquals(0, club.getMembers().size());
        assertEquals(0, club.getEventChairs().size());
    }
}

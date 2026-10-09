package com.campusclubs.repository.sql;

import com.campusclubs.entity.sql.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByStudentId(String studentId);

    boolean existsByEmail(String email);

    boolean existsByStudentId(String studentId);

    List<User> findByRole(User.Role role);

    List<User> findByActiveTrue();

    @Query("SELECT u FROM User u WHERE u.name LIKE %:q% OR u.email LIKE %:q%")
    List<User> searchByNameOrEmail(String q);
}

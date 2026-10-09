# CampusClubs Backend
### Spring Boot 3 · MySQL · MongoDB · JWT · Swagger

Complete RESTful backend for the **CampusClubs** platform — authentication, club management, event lifecycle, LinkedIn-style posts, notifications, analytics, and PDF reports.

---

## Architecture

```
React Frontend (port 3000)
         │  HTTP / JSON
         ▼
┌─────────────────────────────────────────────┐
│            Spring Boot (port 8080)           │
│                                             │
│  AuthController   ─► AuthService            │
│  ClubController   ─► ClubService            │
│  EventController  ─► EventService           │
│  PostController   ─► PostService            │
│  NotifController  ─► NotificationService    │
│  AdminController  ─► AdminService           │
│  ProfileController                          │
│                                             │
│  JwtAuthFilter  ──► SecurityConfig          │
└────────────┬──────────────┬────────────────┘
             │ JPA          │ Spring Data MongoDB
             ▼              ▼
        MySQL DB        MongoDB
   (users, roles,   (clubs, events,
    activity logs)   posts, notifs)
```

---

## Database Split

| Store       | What goes there                                      |
|-------------|------------------------------------------------------|
| **MySQL**   | `users`, `activity_logs` — structured, relational    |
| **MongoDB** | `clubs`, `events`, `posts`, `notifications` — flexible documents |

---

## Quick Start

### 1. Prerequisites
- Java 17+, Maven 3.9+
- MySQL 8.x running on `localhost:3306`
- MongoDB 6.x running on `localhost:27017`

### 2. Create MySQL database
```sql
CREATE DATABASE campusclubs_sql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
MongoDB database (`campusclubs_nosql`) is created automatically.

### 3. Configure credentials
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.username=YOUR_MYSQL_USER
spring.datasource.password=YOUR_MYSQL_PASSWORD
app.jwt.secret=YourSecretKeyAtLeast256BitsLong!!
```

### 4. Build & run
```bash
mvn clean package -DskipTests
java -jar target/campusclubs-backend-1.0.0.jar
```
Or with Maven:
```bash
mvn spring-boot:run
```

### 5. Run tests
```bash
mvn test
```

---

## API Reference

Base URL: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui.html`  
OpenAPI JSON: `http://localhost:8080/api-docs`

### Authentication `/api/auth`

| Method | Path              | Auth | Description                        |
|--------|-------------------|------|------------------------------------|
| POST   | `/register`       | ✗    | Register new student               |
| POST   | `/login`          | ✗    | Login → access + refresh tokens    |
| POST   | `/refresh`        | ✗    | New access token via refresh token |
| POST   | `/logout`         | ✓    | Invalidate refresh token           |
| GET    | `/me`             | ✓    | Current user profile               |

**Login response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid-v4",
    "tokenType": "Bearer",
    "user": { "id": 1, "name": "Kavin", "role": "student", ... }
  }
}
```
Include token in all subsequent requests:
```
Authorization: Bearer <accessToken>
```

---

### Clubs `/api/clubs`

| Method | Path                              | Roles              | Description                   |
|--------|-----------------------------------|--------------------|-------------------------------|
| GET    | `/`                               | Public             | All active clubs              |
| GET    | `/{id}`                           | Public             | Club detail                   |
| GET    | `/my`                             | Any                | Your clubs                    |
| POST   | `/`                               | ADMIN              | Create club                   |
| PUT    | `/{id}`                           | COORD / ADMIN      | Update club                   |
| DELETE | `/{id}`                           | ADMIN              | Deactivate club               |
| POST   | `/{id}/join`                      | STUDENT+           | Submit join request           |
| DELETE | `/{id}/leave`                     | STUDENT+           | Leave club                    |
| PUT    | `/{id}/members/{uid}/approve`     | COORD / ADMIN      | Approve join request          |
| PUT    | `/{id}/members/{uid}/reject`      | COORD / ADMIN      | Reject join request           |
| DELETE | `/{id}/members/{uid}`             | COORD / ADMIN      | Remove member                 |
| PUT    | `/{id}/coordinator`               | ADMIN              | Assign coordinator            |
| PUT    | `/{id}/advisor`                   | ADMIN              | Assign faculty advisor        |
| PUT    | `/{id}/events/{eid}/chair`        | COORD / ADMIN      | Assign/remove event chair     |

**Join request body:**
```json
{
  "department": "Computer Science",
  "year": "2nd Year",
  "phone": "9876543210",
  "skills": "React, Python",
  "whyJoin": "I want to build real projects",
  "experience": "Built a portfolio site"
}
```

---

### Events `/api/events`

| Method | Path                    | Roles         | Description                   |
|--------|-------------------------|---------------|-------------------------------|
| GET    | `/approved`             | Public        | Paginated approved events     |
| GET    | `/club/{clubId}`        | Any           | Events by club                |
| GET    | `/club/{clubId}/pending`| COORD / ADMIN | Pending events for approval   |
| GET    | `/mine`                 | Any           | Events you created            |
| GET    | `/registered`           | Any           | Events you registered for     |
| GET    | `/{id}`                 | Any           | Single event                  |
| POST   | `/`                     | Any member    | Submit event for approval     |
| PUT    | `/{id}/review`          | COORD / ADMIN | Approve / reject event        |
| DELETE | `/{id}`                 | COORD / ADMIN | Delete event                  |
| POST   | `/{id}/register`        | Any           | Register for event            |
| DELETE | `/{id}/register`        | Any           | Cancel registration           |
| PUT    | `/{id}/attendance`      | COORD / ADMIN | Mark attendance               |
| POST   | `/{id}/like`            | Any           | Toggle like                   |
| POST   | `/{id}/comments`        | Any           | Add comment                   |

**Create event body:**
```json
{
  "clubId": "mongo-id",
  "title": "Hackathon 2025",
  "description": "...",
  "category": "Hackathon",
  "venue": "Main Auditorium",
  "eventDate": "2025-08-15T09:00:00Z",
  "registrationDeadline": "2025-08-10T23:59:00Z",
  "maxParticipants": 100,
  "registrationUrl": "https://forms.gle/...",
  "registrationFields": [
    { "label": "Team Name", "type": "text", "required": true }
  ]
}
```

---

### Posts `/api/posts`

| Method | Path              | Roles         | Description           |
|--------|-------------------|---------------|-----------------------|
| GET    | `/`               | Any           | Paginated feed        |
| GET    | `/club/{clubId}`  | Any           | Club posts            |
| POST   | `/`               | Any member    | Create post           |
| DELETE | `/{id}`           | Author/COORD  | Delete post           |
| POST   | `/{id}/like`      | Any           | Toggle like           |
| POST   | `/{id}/comments`  | Any           | Add comment           |
| POST   | `/{id}/vote`      | Any           | Vote on poll          |

**Post types:** `text` · `achievement` · `photo` · `poll`

---

### Notifications `/api/notifications`

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| GET    | `/`               | Paginated notifications            |
| GET    | `/unread`         | All unread notifications           |
| GET    | `/unread/count`   | Unread count badge                 |
| PUT    | `/{id}/read`      | Mark one as read                   |
| PUT    | `/read-all`       | Mark all as read                   |
| POST   | `/announcement`   | Push broadcast (Admin only)        |

---

### Admin `/api/admin` *(ADMIN role only)*

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/users`                      | All users                |
| POST   | `/users`                      | Create student or staff  |
| PUT    | `/users/{id}/role`            | Change role              |
| PUT    | `/users/{id}/toggle-status`   | Activate / deactivate    |
| GET    | `/stats`                      | Dashboard stats          |
| GET    | `/clubs/{clubId}/analytics`   | Club analytics           |
| GET    | `/clubs/{clubId}/report`      | Download PDF report      |
| GET    | `/logs`                       | Recent activity logs     |

---

### Profile `/api/profile`

| Method | Path | Description       |
|--------|------|-------------------|
| GET    | `/`  | My profile        |
| PUT    | `/`  | Update my profile |

---

## Role-Based Access Control

| Role          | Capabilities                                                       |
|---------------|--------------------------------------------------------------------|
| `STUDENT`     | Browse, join clubs, create/register for events, post, vote         |
| `COORDINATOR` | All student rights + approve events/members, manage club, post     |
| `ADVISOR`     | Read-only faculty view                                             |
| `ADMIN`       | Full access — user management, club CRUD, delete any post/event    |

---

## Default Test Credentials

| Role        | Email                    | Password     |
|-------------|--------------------------|--------------|
| Admin       | admin@campus.edu         | admin123     |
| Coordinator | coord@campus.edu         | coord123     |
| Advisor     | advisor@campus.edu       | advisor123   |
| Student     | kavin@campus.edu         | student123   |

*(Seed data must be inserted manually or via a DataLoader bean — not included to keep the project stateless-first.)*

---

## Project Structure

```
src/main/java/com/campusclubs/
├── CampusClubsApplication.java
├── config/
│   ├── SecurityConfig.java       # JWT + CORS + role rules
│   └── OpenApiConfig.java        # Swagger / Springdoc
├── controller/
│   ├── AuthController.java
│   ├── ClubController.java
│   ├── EventController.java
│   ├── PostController.java
│   ├── NotificationController.java
│   ├── AdminController.java
│   └── ProfileController.java
├── dto/
│   ├── request/   # AuthRequests, ClubRequests, EventRequests, PostRequests, AdminRequests
│   └── response/  # ApiResponse<T>, ResponseDtos
├── entity/
│   ├── sql/       # User, ActivityLog  (MySQL via JPA)
│   └── nosql/     # Club, Event, Post, Notification  (MongoDB)
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── BadRequestException.java
├── repository/
│   ├── sql/       # UserRepository, ActivityLogRepository
│   └── nosql/     # ClubRepository, EventRepository, PostRepository, NotificationRepository
├── security/
│   ├── JwtUtils.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
└── service/impl/
    ├── AuthService.java
    ├── ClubService.java
    ├── EventService.java
    ├── PostService.java
    ├── NotificationService.java
    └── AdminService.java          # Includes iText PDF report generation
```

---

## Technologies

| Layer          | Technology                         |
|----------------|------------------------------------|
| Language       | Java 17                            |
| Framework      | Spring Boot 3.2                    |
| Security       | Spring Security + JWT (jjwt 0.12)  |
| SQL DB         | MySQL 8 via Spring Data JPA        |
| NoSQL DB       | MongoDB 6 via Spring Data MongoDB  |
| PDF Export     | iText 5                            |
| API Docs       | Springdoc OpenAPI 2 (Swagger UI)   |
| Testing        | JUnit 5 + Mockito                  |
| Build          | Maven 3.9                          |

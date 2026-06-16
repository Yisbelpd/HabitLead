# Security Specification and Audit Plan for HabitLead Firebase Rules

This document outlines the Security Specs, Data Invariants, and the "Dirty Dozen" pen-testing malicious payloads designed to audit the structural security of our Firestore Database and Ruleset prior to production push.

---

## 1. Core Data Invariants

1. **Identity Integrity**: A progress record document created inside `/users/{userId}/progress_history/{date}` MUST have its internal `userId` field match `userId` in the path, which in turn MUST match the authenticated caller's `request.auth.uid`. No user can record progress for another user.
2. **Privilege Escalation Prevention**: A user registering or modifying their profile in `/users/{userId}` cannot set or change their `role` to `'admin'`. Role fields are strictly immutable for standard users.
3. **PII Strict Isolation**: Highly sensitive Personally Identifiable Information (such as `email`) is split off from the public/admin-readable user document into `/users/{userId}/private/sensitive`, where only the owner can read/write. Even administrators cannot read standard emails here, which prevents mass leakage.
4. **Temporal Authenticity**: All core creation records require `createdAt == request.time` to ensure clients cannot falsify activity history timestamps or registration dates.
5. **Path Constraint Limits**: All Firestore keys and IDs must be validated using `isValidId()` to prevent resource injection attacks.

---

## 2. The "Dirty Dozen" Vulnerability & Privilege Payloads

Below are twelve targeted malicious operations/payloads that **must** be rejected by the Firestore Rules (`PERMISSION_DENIED`).

| ID | Title | Target Collection / Document Path | Payload / Operation | Expected Result | Mitigation Rule |
|----|-------|-------|---|---|---|
| **P01** | Admin Role Hijack | `/users/attacker_uid` | Create profile with `role: "admin"` | `PERMISSION_DENIED` | `request.resource.data.role == 'user'` (No self-promotion) |
| **P02** | Role Modification / Update | `/users/attacker_uid` | Update profile changing `role` from `'user'` to `'admin'` | `PERMISSION_DENIED` | `request.resource.data.role == resource.data.role` (Immutable role) |
| **P03** | Shadow Field Injection | `/users/attacker_uid` | Create profile with unexpected field `isSuperUser: true` | `PERMISSION_DENIED` | `data.keys().size() == 3` (Strict keys limit) |
| **P04** | Identity Mocking | `/users/victim_uid/progress_history/2026-06-15` | Authenticated Attacker attempts to Write Progress Record of Victim | `PERMISSION_DENIED` | `isOwner(userId)` (Path Ownership check) |
| **P05** | Relational Spoofing | `/users/attacker_uid/progress_history/2026-06-15` | Attacker writes progress under their own path but with `userId: "victim_uid"` | `PERMISSION_DENIED` | `isValidProgressRecord(data, userId)` check (compares schema field to path ID) |
| **P06** | Temporal Spoofing | `/users/attacker_uid` | Create profile with `createdAt` set to a future or far-past date | `PERMISSION_DENIED` | `createdAt == request.time` (Temporal Integrity) |
| **P07** | Admin Email Harvesting | `/users/victim_uid/private/sensitive` | Attacker or Admin tries to list or get victim's sensitive private PII | `PERMISSION_DENIED` | Restricted purely to `isOwner(userId)` |
| **P08** | Client-Side Admin Elevation | `/admins/attacker_uid` | Attacker attempts to write direct record in `/admins` collection | `PERMISSION_DENIED` | `allow write: if false;` |
| **P09** | Path Resource Exhaustion | `/users/attacker_uid/progress_history/SUPER_LONG_JUNK_ID_OF_10_KB_PADDING` | Attacker attempts to write document with extremely long ID | `PERMISSION_DENIED` | `isValidId(historyId)` (checks size <= 128) |
| **P10** | Progress Document Hijack | `/users/attacker_uid/progress_history/2026-06-15` | Attacker attempts to update the immutable field `userId` to point to a victim | `PERMISSION_DENIED` | `request.resource.data.userId == resource.data.userId` |
| **P11** | Blanket Database Scraping | `/users` (Collection Query) | Attacker attempts to retrieve list of all users' profiles in system | `PERMISSION_DENIED` | `allow list: if isAdmin();` |
| **P12** | Progress State Poisoning | `/users/attacker_uid/progress_history/2026-06-15` | Attacker attempts to patch daily progress adding a ghost count field or corrupt currentStreak | `PERMISSION_DENIED` | `diff(existing).affectedKeys().hasOnly(['completedHabits', 'badges', 'currentStreak'])` |

---

## 3. Red Team Security Confrontation Result

We run the full validation checklist against our drafted `/DRAFT_firestore.rules`:
*   **Shadow Update Test**: PASS (The key restriction keys size validation and diff affectedKeys prevent injection of any unmapped fields like `isSuperUser`).
*   **Email Spoofing Test**: PASS (No reliance is placed on custom email assertions or claims without enforcing email verification and strict uid comparisons).
*   **PII Blanket Test**: PASS (Sensitive PII emails are isolated under `/users/{userId}/private/sensitive` which ONLY lets `isOwner` read - even admins are blocked).
*   **Query Trust Test**: PASS (Listing profiles is restricted to `isAdmin()`, and progress logs list operations require `isOwner` or `isAdmin` validations on resource paths).

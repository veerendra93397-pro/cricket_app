import 'package:firebase_auth/firebase_auth.dart';

class AdminHelper {
  // List of admin emails (you can add more admins later)
  static const List<String> adminEmails = ['admin@gmail.com'];

  // Check if current user is admin
  static bool isAdmin() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return false;
    return adminEmails.contains(user.email?.toLowerCase());
  }

  // Check if user can edit/delete (admin OR owner)
  static bool canEdit(String createdByUid) {
    if (isAdmin()) return true;
    return FirebaseAuth.instance.currentUser?.uid == createdByUid;
  }
}
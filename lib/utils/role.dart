import 'package:firebase_auth/firebase_auth.dart';

class Role {
  static const String adminEmail = "admin@gmail.com";

  static bool isAdmin() {
    final user = FirebaseAuth.instance.currentUser;
    return user?.email == adminEmail;
  }
}
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class UserRoleService {
  static Future<String> getRole() async {
    final user = FirebaseAuth.instance.currentUser;

    debugPrint("EMAIL = ${user?.email}");
    debugPrint("UID = ${user?.uid}");

    if (user == null) return "user";

    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();

    debugPrint("DOC EXISTS = ${doc.exists}");

    if (!doc.exists) return "user";

    final role = doc.data()?['role'] ?? "user";

    debugPrint("ROLE = $role");

    return role;
  }

  static Future<bool> isAdmin() async {
    return await getRole() == "admin";
  }
}
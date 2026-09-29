import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class UserSetupService {

  static Future<void> createUserProfile() async {

    final user = FirebaseAuth.instance.currentUser;

    if (user == null) return;

    final userRef = FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid);

    final doc = await userRef.get();

    if (doc.exists) return;

    await userRef.set({
      'uid': user.uid,
      'email': user.email,
      'role': 'user',
      'createdAt': DateTime.now().toString(),
    });
  }
}
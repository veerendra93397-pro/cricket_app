import 'package:flutter/material.dart';
import '../utils/cric_theme.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class MyProfileScreen extends StatefulWidget {
  const MyProfileScreen({super.key});

  @override
  State<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends State<MyProfileScreen> {
  Map<String, dynamic>? playerData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlayerData();
  }

  Future<void> _loadPlayerData() async {
    try {
      String uid = FirebaseAuth.instance.currentUser!.uid;
      DocumentSnapshot doc = await FirebaseFirestore.instance
          .collection('players')
          .doc(uid)
          .get();

      if (doc.exists) {
        setState(() {
          playerData = doc.data() as Map<String, dynamic>;
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      debugPrint("Error loading player data: $e");
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("My Profile"),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // ✅ FIX: Check both field name variations
    final String email = playerData?['email'] ?? FirebaseAuth.instance.currentUser?.email ?? '';
    final String playerName = playerData?['playerName']?.toString().isNotEmpty == true
        ? playerData!['playerName']
        : (email.isNotEmpty 
            ? email.split('@').first.toUpperCase() 
            : 'User');
    
    // ✅ FIX: Check both 'teamName' and 'teamname'
    final String team = playerData?['teamName'] ?? playerData?['teamname'] ?? 'N/A';
    final int age = playerData?['age'] ?? 0;
    final String role = playerData?['role'] ?? 'N/A';
    final int jerseyNumber = playerData?['jerseyNumber'] ?? playerData?['jerseynumber'] ?? 0;
    final String initial = playerName.isNotEmpty ? playerName[0].toUpperCase() : 'U';

    return Scaffold(
      appBar: AppBar(
        title: const Text("My Profile"),
        automaticallyImplyLeading: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 30),
            
            // Profile Avatar
            CircleAvatar(
              radius: 60,
              backgroundColor: CricTheme.primary,
              child: Text(
                initial,
                style: const TextStyle(
                  fontSize: 50,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 15),
            
            // Player Name
            Text(
              playerName,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 5),
            
            // Email
            Text(
              email,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Profile Details
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  // Jersey Number
                  _buildProfileCard(
                    icon: Icons.sports_esports,
                    iconColor: CricTheme.primary,
                    label: "Jersey Number",
                    value: jerseyNumber.toString(),
                    valueColor: CricTheme.primary,
                    backgroundColor: Colors.blue.shade50,
                  ),
                  const SizedBox(height: 15),
                  
                  // Age
                  _buildProfileCard(
                    icon: Icons.cake,
                    iconColor: Colors.green,
                    label: "Age",
                    value: age > 0 ? "$age years" : "N/A",
                    valueColor: Colors.green,
                    backgroundColor: Colors.green.shade50,
                  ),
                  const SizedBox(height: 15),
                  
                  // Role
                  _buildProfileCard(
                    icon: Icons.sports_cricket,
                    iconColor: Colors.orange,
                    label: "Role",
                    value: role,
                    valueColor: Colors.orange,
                    backgroundColor: Colors.orange.shade50,
                  ),
                  const SizedBox(height: 15),
                  
                  // Team
                  _buildProfileCard(
                    icon: Icons.groups,
                    iconColor: Colors.purple,
                    label: "Team",
                    value: team,
                    valueColor: Colors.purple,
                    backgroundColor: Colors.purple.shade50,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 30),
            
            // Edit Profile Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Edit profile coming soon!")),
                    );
                  },
                  icon: const Icon(Icons.edit),
                  label: const Text("Edit Profile", style: TextStyle(fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CricTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required Color valueColor,
    required Color backgroundColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: iconColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    color: valueColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
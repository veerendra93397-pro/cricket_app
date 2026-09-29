import 'package:flutter/material.dart';
import '../utils/cric_theme.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'home_screen.dart';

class PlayerRegistrationScreen extends StatefulWidget {
  const PlayerRegistrationScreen({super.key});

  @override
  State<PlayerRegistrationScreen> createState() => _PlayerRegistrationScreenState();
}

class _PlayerRegistrationScreenState extends State<PlayerRegistrationScreen> {
  final nameController = TextEditingController();
  final ageController = TextEditingController();
  final jerseyController = TextEditingController();
  
  String selectedRole = 'Batsman';
  String? selectedTeam;
  bool isLoading = true;
  bool isExistingUser = false;
  List<String> teamsList = [];

  final List<String> roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

  @override
  void initState() {
    super.initState();
    _loadTeamsFromFirestore();
    _checkIfUserExists();
  }

  // 🔥 Fetch teams from Firestore
  Future<void> _loadTeamsFromFirestore() async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('teams')
          .get();

        List<String> teams = snapshot.docs.map<String>((doc) {
            final data = doc.data() as Map<String, dynamic>;
            return data['teamName']?.toString() ?? 'Unknown';
            }).toList();

      setState(() {
        teamsList = teams;
        if (teams.isNotEmpty) {
          selectedTeam = teams.first;
        }
      });
    } catch (e) {
      debugPrint("Error loading teams: $e");
    }
  }

  Future<void> _checkIfUserExists() async {
    String uid = FirebaseAuth.instance.currentUser!.uid;
    
    try {
      DocumentSnapshot doc = await FirebaseFirestore.instance
          .collection('players')
          .doc(uid)
          .get();

      if (doc.exists) {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => HomeScreen()),
          );
        }
      } else {
        if (mounted) {
          setState(() {
            isLoading = false;
            isExistingUser = false;
          });
        }
      }
    } catch (e) {
      debugPrint("Error checking user: $e");
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> savePlayerData() async {
    if (nameController.text.isEmpty || ageController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill Name and Age")),
      );
      return;
    }

    if (selectedTeam == null || selectedTeam!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a team")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      String uid = FirebaseAuth.instance.currentUser!.uid;
      String email = FirebaseAuth.instance.currentUser!.email!;

      await FirebaseFirestore.instance.collection('players').doc(uid).set({
        'uid': uid,
        'playerName': nameController.text.trim(),
        'email': email,
        'age': int.tryParse(ageController.text.trim()) ?? 0,
        'jerseyNumber': int.tryParse(jerseyController.text.trim()) ?? 0,
        'role': selectedRole,
        'teamName': selectedTeam,
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Registration Successful!")),
        );
        
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => HomeScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error saving data: $e")),
        );
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Player Registration"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Complete your profile",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              "Please enter your details to start playing.",
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 30),
            
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: "Player Name *",
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 15),
            
            TextField(
              controller: ageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: "Age *",
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.cake),
              ),
            ),
            const SizedBox(height: 15),
            
            TextField(
              controller: jerseyController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: "Jersey Number",
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.sports_esports),
              ),
            ),
            const SizedBox(height: 15),
            
            const Text("Select Role:", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: selectedRole,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: roles.map((role) => DropdownMenuItem(value: role, child: Text(role))).toList(),
              onChanged: (val) => setState(() => selectedRole = val!),
            ),
            const SizedBox(height: 15),
            
            const Text("Select Team:", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(height: 10),
            
            // ✅ Show teams from Firestore
            teamsList.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(10),
                    child: Text(
                      "No teams available. Please contact admin.",
                      style: TextStyle(color: Colors.red),
                    ),
                  )
                : DropdownButtonFormField<String>(
                    value: selectedTeam,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.groups),
                    ),
                    items: teamsList.map((team) {
                      return DropdownMenuItem(value: team, child: Text(team));
                    }).toList(),
                    onChanged: (val) => setState(() => selectedTeam = val),
                  ),
            const SizedBox(height: 30),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: savePlayerData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: CricTheme.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text("SAVE & CONTINUE", style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
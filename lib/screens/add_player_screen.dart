import 'package:flutter/material.dart';
import '../utils/cric_theme.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AddPlayerScreen extends StatefulWidget {
  const AddPlayerScreen({super.key});

  @override
  State<AddPlayerScreen> createState() => _AddPlayerScreenState();
}

class _AddPlayerScreenState extends State<AddPlayerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _mobileController = TextEditingController();
  final _ageController = TextEditingController();
  final _jerseyController = TextEditingController();
  
  String? _selectedRole;
  String? _selectedTeam;
  List<String> _teams = [];
  bool _isLoading = false;
  bool _createAccount = false;

  final List<String> _roles = [
    'Batsman',
    'Bowler',
    'All-Rounder',
    'Wicket-Keeper',
  ];

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance.collection('teams').get();
      List<String> teamList = snapshot.docs.map((doc) {
        return (doc['teamName'] ?? doc['teamname'] ?? '').toString();
      }).where((team) => team.isNotEmpty).toList();

      setState(() {
        _teams = teamList;
      });
    } catch (e) {
      debugPrint("Error loading teams: $e");
    }
  }

  Future<void> _addPlayer() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedTeam == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a team")),
      );
      return;
    }
    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a role")),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      String? playerUid;

      // Create Firebase Auth account if email is provided
      if (_createAccount && _emailController.text.isNotEmpty) {
        try {
          UserCredential userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
            email: _emailController.text.trim(),
            password: _passwordController.text.trim(),
          );
          playerUid = userCredential.user!.uid;
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Error creating account: $e")),
            );
          }
          setState(() => _isLoading = false);
          return;
        }
      }

      // Save player data to Firestore
      Map<String, dynamic> playerData = {
        'playerName': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'mobile': _mobileController.text.trim(),
        'age': int.tryParse(_ageController.text) ?? 0,
        'role': _selectedRole,
        'teamName': _selectedTeam,
        'jerseyNumber': int.tryParse(_jerseyController.text) ?? 0,
        'createdAt': FieldValue.serverTimestamp(),
        'createdBy': FirebaseAuth.instance.currentUser!.uid,
      };

      if (playerUid != null) {
        // Save with the new user's UID
        await FirebaseFirestore.instance.collection('players').doc(playerUid).set(playerData);
      } else {
        // Save with auto-generated ID
        await FirebaseFirestore.instance.collection('players').add(playerData);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Player added successfully!"),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _mobileController.dispose();
    _ageController.dispose();
    _jerseyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(        title: const Text("Add New Player"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Player Details",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),

              // Player Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: "Player Name *",
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.isEmpty ? "Please enter player name" : null,
              ),
              const SizedBox(height: 15),

              // Create Account Checkbox
              CheckboxListTile(
                title: const Text("Create login account for this player"),
                subtitle: const Text("Player can login with email/password"),
                value: _createAccount,
                onChanged: (val) => setState(() => _createAccount = val!),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 15),

              // Email
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: "Email ${_createAccount ? '*' : '(Optional)'}",
                  prefixIcon: const Icon(Icons.email),
                  border: const OutlineInputBorder(),
                ),
                validator: (val) {
                  if (_createAccount && (val == null || val.isEmpty)) {
                    return "Email is required when creating account";
                  }
                  return null;
                },
              ),
              const SizedBox(height: 15),

              // Password (only if creating account)
              if (_createAccount) ...[
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: "Password *",
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                  validator: (val) {
                    if (_createAccount && (val == null || val.isEmpty)) {
                      return "Password is required";
                    }
                    if (_createAccount && val!.length < 6) {
                      return "Password must be at least 6 characters";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 15),
              ],

              // Mobile Number
              TextFormField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: "Mobile Number",
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 15),

              // Age
              TextFormField(
                controller: _ageController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: "Age",
                  prefixIcon: Icon(Icons.cake),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 15),

              // Role Dropdown
              DropdownButtonFormField<String>(
                value: _selectedRole,
                decoration: const InputDecoration(
                  labelText: "Role *",
                  prefixIcon: Icon(Icons.sports_cricket),
                  border: OutlineInputBorder(),
                ),
                items: _roles.map((role) => DropdownMenuItem(value: role, child: Text(role))).toList(),
                onChanged: (val) => setState(() => _selectedRole = val),
                validator: (val) => val == null ? "Please select role" : null,
              ),
              const SizedBox(height: 15),

              // Team Dropdown
              DropdownButtonFormField<String>(
                value: _selectedTeam,
                decoration: const InputDecoration(
                  labelText: "Team *",
                  prefixIcon: Icon(Icons.groups),
                  border: OutlineInputBorder(),
                ),
                items: _teams.map((team) => DropdownMenuItem(value: team, child: Text(team))).toList(),
                onChanged: (val) => setState(() => _selectedTeam = val),
                validator: (val) => val == null ? "Please select team" : null,
              ),
              const SizedBox(height: 15),

              // Jersey Number
              TextFormField(
                controller: _jerseyController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: "Jersey Number",
                  prefixIcon: Icon(Icons.sports_esports),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 30),

              // Add Player Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _addPlayer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CricTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text("ADD PLAYER", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
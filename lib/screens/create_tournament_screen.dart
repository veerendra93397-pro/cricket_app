import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class CreateTournamentScreen extends StatefulWidget {
  const CreateTournamentScreen({super.key});

  @override
  State<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends State<CreateTournamentScreen> {
  final _nameController = TextEditingController();
  List<String> selectedTeams = [];
  int oversPerMatch = 5;
  bool isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _createTournament() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please enter tournament name")));
      return;
    }

    if (selectedTeams.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please select at least 2 teams")));
      return;
    }

    setState(() => isLoading = true);

    try {
      int totalMatches = (selectedTeams.length * (selectedTeams.length - 1)) ~/ 2;

      Map<String, dynamic> pointsTable = {};
      for (String team in selectedTeams) {
        pointsTable[team] = {
          'played': 0,
          'won': 0,
          'lost': 0,
          'nrr': 0.0,
          'points': 0,
        };
      }

      DocumentReference tournamentRef = await FirebaseFirestore.instance.collection('tournaments').add({
        'name': _nameController.text.trim(),
        'teams': selectedTeams,
        'totalMatches': totalMatches,
        'completedMatches': 0,
        'oversPerMatch': oversPerMatch,
        'status': 'upcoming',
        'pointsTable': pointsTable,
        'createdAt': FieldValue.serverTimestamp(),
      });

      String tournamentId = tournamentRef.id;

      for (int i = 0; i < selectedTeams.length; i++) {
        for (int j = i + 1; j < selectedTeams.length; j++) {
          await FirebaseFirestore.instance.collection('matches').add({
            'tournamentId': tournamentId,
            'team1': selectedTeams[i],
            'team2': selectedTeams[j],
            'status': 'upcoming',
            'totalOvers': oversPerMatch,
            'venue': 'TBD',
            'matchDate': FieldValue.serverTimestamp(),
            'team1Score': '0/0',
            'team1Overs': '0.0',
            'team1Runs': 0,
            'team1Wickets': 0,
          });
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Tournament created successfully!"), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(        title: const Text("Create Tournament"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Tournament Name", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                hintText: "e.g., BTG Cup 2026",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: const Icon(Icons.emoji_events),
              ),
            ),
            const SizedBox(height: 20),

            const Text("Overs Per Match", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            DropdownButtonFormField<int>(
              value: oversPerMatch,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                labelText: "Overs Per Match",
              ),
              items: List.generate(20, (index) => index + 1).map((overs) {
                return DropdownMenuItem(
                  value: overs,
                  child: Text("$overs Over${overs > 1 ? 's' : ''}"),
                );
              }).toList(),
              onChanged: (val) => setState(() => oversPerMatch = val!),
            ),
            const SizedBox(height: 20),

            const Text("Select Teams", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('teams').snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final teams = snapshot.data!.docs;

                if (teams.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    color: Colors.red.shade50,
                    child: const Text("No teams found. Please add teams first!", style: TextStyle(color: Colors.red)),
                  );
                }

                return Column(
                  children: teams.map((doc) {
                    final teamData = doc.data() as Map<String, dynamic>;
                    final teamName = teamData['teamName'] ?? 'Unknown';
                    final isSelected = selectedTeams.contains(teamName);

                    return Card(
                      color: isSelected ? Colors.blue.shade50 : Colors.white,
                      child: CheckboxListTile(
                        title: Text(teamName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        value: isSelected,
                        onChanged: (val) {
                          setState(() {
                            if (val == true) {
                              selectedTeams.add(teamName);
                            } else {
                              selectedTeams.remove(teamName);
                            }
                          });
                        },
                      ),
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 20),

            if (selectedTeams.length >= 2)
              Container(
                padding: const EdgeInsets.all(15),
                color: Colors.green.shade50,
                child: Text(
                  "${selectedTeams.length} teams selected → ${selectedTeams.length * (selectedTeams.length - 1) ~/ 2} matches will be created",
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                ),
              ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isLoading ? null : _createTournament,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1a1a2e),
                  foregroundColor: Colors.white,
                ),
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("CREATE TOURNAMENT", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
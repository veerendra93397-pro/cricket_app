import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'live_scoring_interface.dart';

class MatchSetupScreen extends StatefulWidget {
  final String matchId;
  final String team1;
  final String team2;

  const MatchSetupScreen({
    super.key,
    required this.matchId,
    required this.team1,
    required this.team2,
  });

  @override
  State<MatchSetupScreen> createState() => _MatchSetupScreenState();
}

class _MatchSetupScreenState extends State<MatchSetupScreen> {
  String? tossWinner;
  String? tossDecision;
  String? battingTeam;
  String? bowlingTeam;
  int totalOvers = 20; // ✅ Default to 20 overs

  List<Map<String, dynamic>> battingTeamPlayers = [];
  List<Map<String, dynamic>> bowlingTeamPlayers = [];
  
  List<String> selectedBatsmen = [];
  String? selectedBowler;

  bool isLoadingPlayers = false;

  @override
  void initState() {
    super.initState();
    tossWinner = widget.team1;
    tossDecision = 'bat';
    _updateTeamsBasedOnToss();
  }

  void _updateTeamsBasedOnToss() {
    if (tossWinner == null || tossDecision == null) return;
    
    if (tossDecision == 'bat') {
      battingTeam = tossWinner;
      bowlingTeam = (tossWinner == widget.team1) ? widget.team2 : widget.team1;
    } else {
      bowlingTeam = tossWinner;
      battingTeam = (tossWinner == widget.team1) ? widget.team2 : widget.team1;
    }
    _loadPlayers();
  }

  Future<void> _loadPlayers() async {
    if (battingTeam == null || bowlingTeam == null) return;
    setState(() => isLoadingPlayers = true);

    try {
      debugPrint("🔍 Loading players for batting team: $battingTeam");
      debugPrint("🔍 Loading players for bowling team: $bowlingTeam");

      QuerySnapshot batSnap = await FirebaseFirestore.instance
          .collection('players')
          .where('teamName', isEqualTo: battingTeam)
          .get();
      
      QuerySnapshot bowlSnap = await FirebaseFirestore.instance
          .collection('players')
          .where('teamName', isEqualTo: bowlingTeam)
          .get();

      debugPrint("✅ Found ${batSnap.docs.length} players for $battingTeam");
      debugPrint("✅ Found ${bowlSnap.docs.length} players for $bowlingTeam");

      setState(() {
        battingTeamPlayers = batSnap.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          return {
            'playerName': data['playerName'] ?? 'Unknown',
            'role': data['role'] ?? 'N/A',
            'id': doc.id,
          };
        }).toList();

        bowlingTeamPlayers = bowlSnap.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          return {
            'playerName': data['playerName'] ?? 'Unknown',
            'role': data['role'] ?? 'N/A',
            'id': doc.id,
          };
        }).toList();

        isLoadingPlayers = false;
      });
    } catch (e) {
      debugPrint("❌ Error loading players: $e");
      setState(() => isLoadingPlayers = false);
    }
  }

  void _toggleBatsman(String playerName) {
    setState(() {
      if (selectedBatsmen.contains(playerName)) {
        selectedBatsmen.remove(playerName);
      } else {
        if (selectedBatsmen.length < 2) {
          selectedBatsmen.add(playerName);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("You can only select 2 opening batsmen")),
          );
        }
      }
    });
  }

  Future<void> _startMatch() async {
    debugPrint("🔴 START MATCH BUTTON CLICKED!");
    debugPrint("Selected batsmen: $selectedBatsmen");
    debugPrint("Selected bowler: $selectedBowler");
    debugPrint("Batting team: $battingTeam");
    debugPrint("Bowling team: $bowlingTeam");
    debugPrint("Total overs: $totalOvers");

    if (selectedBatsmen.length != 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select 2 opening batsmen"),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    if (selectedBowler == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select 1 opening bowler"),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => isLoadingPlayers = true);

    try {
      List<Map<String, dynamic>> initialBatsmen = selectedBatsmen.map((name) {
        return {
          'name': name, 
          'runs': 0, 
          'balls': 0, 
          'fours': 0, 
          'sixes': 0, 
          'isOnStrike': name == selectedBatsmen.first
        };
      }).toList();

      Map<String, dynamic> initialBowler = {
        'name': selectedBowler,
        'overs': '0.0',
        'runs': 0,
        'wickets': 0,
        'maidens': 0,
      };

      debugPrint("🏏 Updating match ${widget.matchId} to live status...");
      debugPrint("Team 1 (Batting): $battingTeam");
      debugPrint("Team 2 (Bowling): $bowlingTeam");
      
      // Update Firestore
      await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
        'status': 'live',
        'tossWinner': tossWinner,
        'tossDecision': tossDecision,
        'team1': battingTeam,
        'team2': bowlingTeam,
        'totalOvers': totalOvers, // ✅ Save total overs
        'team1Score': '0/0',
        'team1Overs': '0.0',
        'team1Runs': 0,
        'team1Wickets': 0,
        'team2Score': '0/0',
        'team2Overs': '0.0',
        'team2Runs': 0,
        'team2Wickets': 0,
        'currentBatsmen': initialBatsmen,
        'currentBowler': initialBowler,
        'recentBalls': [],
        'updatedAt': FieldValue.serverTimestamp(),
      });

      debugPrint("✅ Match updated successfully to LIVE!");

      if (mounted) {
        // Navigate to Live Scoring Interface
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => LiveScoringInterface(
              matchId: widget.matchId,
              matchData: {
                'team1': battingTeam,
                'team2': bowlingTeam,
                'status': 'live',
                'totalOvers': totalOvers,
                'team1Score': '0/0',
                'team1Overs': '0.0',
                'team2Score': '0/0',
                'team2Overs': '0.0',
                'currentBatsmen': initialBatsmen,
                'currentBowler': initialBowler,
                'recentBalls': [],
              },
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint("❌ Error starting match: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error starting match: $e"),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => isLoadingPlayers = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Match Setup"), 
      ),
      body: isLoadingPlayers
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "1. Toss Details", 
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)
                  ),
                  const SizedBox(height: 10),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(15),
                      child: Column(
                        children: [
                          DropdownButtonFormField<String>(
                            value: tossWinner,
                            decoration: const InputDecoration(
                              labelText: "Toss Winner", 
                              border: OutlineInputBorder()
                            ),
                            items: [widget.team1, widget.team2].map((t) {
                              return DropdownMenuItem(value: t, child: Text(t));
                            }).toList(),
                            onChanged: (val) {
                              setState(() {
                                tossWinner = val;
                                _updateTeamsBasedOnToss();
                              });
                            },
                          ),
                          const SizedBox(height: 15),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () { 
                                    setState(() { 
                                      tossDecision = 'bat'; 
                                      _updateTeamsBasedOnToss(); 
                                    }); 
                                  }, 
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: tossDecision == 'bat' ? Colors.blue : Colors.grey,
                                    foregroundColor: Colors.white,
                                  ), 
                                  child: const Text("BAT")
                                )
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () { 
                                    setState(() { 
                                      tossDecision = 'bowl'; 
                                      _updateTeamsBasedOnToss(); 
                                    }); 
                                  }, 
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: tossDecision == 'bowl' ? Colors.blue : Colors.grey,
                                    foregroundColor: Colors.white,
                                  ), 
                                  child: const Text("BOWL")
                                )
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ✅ Match Format / Total Overs Section
                  const Text(
                    "2. Match Format", 
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)
                  ),
                  const SizedBox(height: 10),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(15),
                      child: Column(
                        children: [
                          const Text("Total Overs per Innings", style: TextStyle(fontSize: 14)),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<int>(
                            value: totalOvers,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              labelText: "Total Overs per Innings",
                            ),
                            items: List.generate(20, (index) => index + 1).map((overs) {
                              return DropdownMenuItem(
                                value: overs,
                                child: Text("$overs Over${overs > 1 ? 's' : ''}"),
                                );
                            }).toList(),
                            onChanged: (val) => setState(() => totalOvers = val!),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Text(
                    "3. Select Opening Batsmen (${battingTeam ?? 'Team'})", 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)
                  ),
                  const SizedBox(height: 10),
                  if (battingTeamPlayers.isEmpty) 
                    Container(
                      padding: const EdgeInsets.all(20),
                      color: Colors.red.shade50,
                      child: const Text(
                        "No players found for this team. Please add players first!", 
                        style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)
                      ),
                    )
                  else 
                    ...battingTeamPlayers.map((player) {
                      String name = player['playerName'] ?? 'Unknown';
                      String role = player['role'] ?? '';
                      bool isSelected = selectedBatsmen.contains(name);
                      return Card(
                        color: isSelected ? Colors.blue.shade50 : Colors.white,
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isSelected ? Colors.blue : Colors.grey.shade300,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: TextStyle(color: isSelected ? Colors.white : Colors.black),
                            ),
                          ),
                          title: Text(
                            name,
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(role),
                          trailing: isSelected 
                              ? const Icon(Icons.check_circle, color: Colors.green, size: 30) 
                              : const Icon(Icons.circle_outlined, size: 30),
                          onTap: () => _toggleBatsman(name),
                        ),
                      );
                    }).toList(),
                  const SizedBox(height: 20),

                  Text(
                    "4. Select Opening Bowler (${bowlingTeam ?? 'Team'})", 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)
                  ),
                  const SizedBox(height: 10),
                  if (bowlingTeamPlayers.isEmpty) 
                    Container(
                      padding: const EdgeInsets.all(20),
                      color: Colors.red.shade50,
                      child: const Text(
                        "No players found for this team.", 
                        style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)
                      ),
                    )
                  else 
                    ...bowlingTeamPlayers.map((player) {
                      String name = player['playerName'] ?? 'Unknown';
                      String role = player['role'] ?? '';
                      bool isSelected = selectedBowler == name;
                      return Card(
                        color: isSelected ? Colors.blue.shade50 : Colors.white,
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isSelected ? Colors.blue : Colors.grey.shade300,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: TextStyle(color: isSelected ? Colors.white : Colors.black),
                            ),
                          ),
                          title: Text(
                            name,
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(role),
                          trailing: isSelected 
                              ? const Icon(Icons.check_circle, color: Colors.green, size: 30) 
                              : const Icon(Icons.circle_outlined, size: 30),
                          onTap: () => setState(() => selectedBowler = name),
                        ),
                      );
                    }).toList(),
                  const SizedBox(height: 30),

                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: _startMatch,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green, 
                        foregroundColor: Colors.white,
                        elevation: 5,
                      ),
                      child: const Text(
                        "🏏 START LIVE MATCH", 
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
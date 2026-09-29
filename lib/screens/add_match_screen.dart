import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class AddMatchScreen extends StatefulWidget {
  const AddMatchScreen({super.key});

  @override
  State<AddMatchScreen> createState() => _AddMatchScreenState();
}

class _AddMatchScreenState extends State<AddMatchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _venueController = TextEditingController();

  String? _team1;
  String? _team2;
  DateTime _matchDate = DateTime.now();
  TimeOfDay _matchTime = TimeOfDay.now();
  bool _saving = false;

  @override
  void dispose() {
    _venueController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _matchDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(primary: CricTheme.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _matchDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _matchTime,
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(primary: CricTheme.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _matchTime = picked);
  }

  Future<void> _createMatch() async {
    if (!_formKey.currentState!.validate()) return;

    if (_team1 == null || _team2 == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both teams'),
          backgroundColor: CricTheme.wicketRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_team1 == _team2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Team 1 and Team 2 must be different'),
          backgroundColor: CricTheme.wicketRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      final timeStr = _matchTime.format(context);

      await FirebaseFirestore.instance.collection('matches').add({
        'team1': _team1,
        'team2': _team2,
        'team1Score': '0/0',
        'team2Score': '0/0',
        'team1Overs': '0.0',
        'venue': _venueController.text.trim(),
        'matchDate': Timestamp.fromDate(_matchDate),
        'matchTime': timeStr,
        'status': 'upcoming',
        'winner': '',
        'result': '',
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Match created'),
            backgroundColor: CricTheme.completedGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create match: $e'),
            backgroundColor: CricTheme.wicketRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }

    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(title: const Text('Add Match')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('teams').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const LoadingState();
          }

          final teamNames = snapshot.data!.docs
              .map((d) => (d.data() as Map<String, dynamic>)['teamName']?.toString() ?? '')
              .where((n) => n.isNotEmpty)
              .toSet()
              .toList()
            ..sort();

          if (teamNames.length < 2) {
            return const EmptyState(
              icon: Icons.groups_outlined,
              title: 'Need at least 2 teams',
              subtitle: 'Add teams first before scheduling a match',
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Select Teams', padding: EdgeInsets.only(bottom: 12)),
                  AppCard(
                    child: Column(
                      children: [
                        _buildTeamDropdown(
                          label: 'Team 1',
                          value: _team1,
                          teamNames: teamNames,
                          onChanged: (v) => setState(() => _team1 = v),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: CricTheme.surfaceMuted,
                              borderRadius: BorderRadius.circular(CricTheme.radiusPill),
                            ),
                            child: const Text('VS',
                                style: TextStyle(fontWeight: FontWeight.w800, color: CricTheme.textMuted)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildTeamDropdown(
                          label: 'Team 2',
                          value: _team2,
                          teamNames: teamNames,
                          onChanged: (v) => setState(() => _team2 = v),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const SectionHeader(title: 'Match Details', padding: EdgeInsets.only(bottom: 12)),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextFormField(
                          controller: _venueController,
                          decoration: const InputDecoration(
                            labelText: 'Venue',
                            prefixIcon: Icon(Icons.location_on_outlined),
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter a venue' : null,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                                onTap: _pickDate,
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Date',
                                    prefixIcon: Icon(Icons.calendar_today_outlined),
                                  ),
                                  child: Text(
                                    '${_matchDate.day}/${_matchDate.month}/${_matchDate.year}',
                                    style: CricTheme.bodyText,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                                onTap: _pickTime,
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Time',
                                    prefixIcon: Icon(Icons.access_time),
                                  ),
                                  child: Text(_matchTime.format(context), style: CricTheme.bodyText),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  PrimaryButton(
                    label: 'Create Match',
                    loading: _saving,
                    onPressed: _createMatch,
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTeamDropdown({
    required String label,
    required String? value,
    required List<String> teamNames,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.groups_outlined),
      ),
      hint: const Text('Select a team'),
      items: teamNames
          .map((name) => DropdownMenuItem(value: name, child: Text(name)))
          .toList(),
      onChanged: onChanged,
      validator: (v) => v == null ? 'Please select a team' : null,
    );
  }
}

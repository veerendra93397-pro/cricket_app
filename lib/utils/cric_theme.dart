import 'package:flutter/material.dart';

/// ============================================================
/// BTG CRICKET — Unified Design System
/// Single source of truth for color, type, spacing & shape.
/// Every screen in the app pulls from here so the UI reads as
/// one cohesive product instead of a patchwork of screens.
/// ============================================================
class CricTheme {
  CricTheme._();

  // ---------------------------------------------------------
  // BRAND COLORS
  // ---------------------------------------------------------
  static const Color primaryDark = Color(0xFF06251C);
  static const Color primary = Color(0xFF0B3D2E);
  static const Color primaryMedium = Color(0xFF0F5238);
  static const Color primaryLight = Color(0xFF14764E);
  static const Color accent = Color(0xFF00C853); // pitch green
  static const Color accentDeep = Color(0xFF00A94D);
  static const Color gold = Color(0xFFFFB300);

  // Backward-compatible aliases (kept so nothing breaks if referenced)
  static const Color headerStart = primaryDark;
  static const Color headerEnd = primaryLight;
  static const Color accentGreen = accent;
  static const Color accentBlue = Color(0xFF2979FF);
  static const Color accentOrange = Color(0xFFFF9100);
  static const Color accentRed = Color(0xFFE53935);
  static const Color accentPurple = Color(0xFF7C4DFF);
  static const Color accentYellow = gold;

  // ---------------------------------------------------------
  // SURFACES (light, airy app — dark only for hero/stadium moments)
  // ---------------------------------------------------------
  static const Color scaffold = Color(0xFFF4F7F5);
  static const Color surface = Colors.white;
  static const Color surfaceMuted = Color(0xFFEFF3F0);
  static const Color cardBg = Colors.white;
  static const Color cardDark = Color(0xFF10241C);
  static const Color divider = Color(0xFFE4EAE6);
  static const Color background = primaryDark; // used by dark/hero screens

  // ---------------------------------------------------------
  // TEXT
  // ---------------------------------------------------------
  static const Color textDark = Color(0xFF13201B);
  static const Color textPrimary = Color(0xFF13201B);
  static const Color textSecondary = Color(0xFF5B6B63);
  static const Color textMuted = Color(0xFF8A978F);
  static const Color textOnDark = Colors.white;
  static const Color textOnDarkMuted = Color(0xFFB9C9C0);
  static const Color textGreen = accentDeep;
  static const Color textRed = Color(0xFFD32F2F);

  // ---------------------------------------------------------
  // STATUS
  // ---------------------------------------------------------
  static const Color liveRed = Color(0xFFE53935);
  static const Color completedGreen = Color(0xFF2E7D32);
  static const Color upcomingOrange = Color(0xFFFF9100);

  // ---------------------------------------------------------
  // SCORING (ball-by-ball chips)
  // ---------------------------------------------------------
  static const Color boundaryGreen = Color(0xFF00A550);
  static const Color sixPurple = Color(0xFF7C4DFF);
  static const Color extraAmber = Color(0xFFFF9100);
  static const Color wicketRed = Color(0xFFE53935);
  static const Color strikeBg = Color(0xFFE7F7EE);
  static const Color strikeBorder = accentDeep;

  // ---------------------------------------------------------
  // SPACING / RADIUS SCALE
  // ---------------------------------------------------------
  static const double s4 = 4;
  static const double s8 = 8;
  static const double s12 = 12;
  static const double s16 = 16;
  static const double s20 = 20;
  static const double s24 = 24;
  static const double s32 = 32;

  static const double radiusSm = 10;
  static const double radiusMd = 14;
  static const double radiusLg = 20;
  static const double radiusPill = 999;

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: primaryDark.withValues(alpha: 0.06),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: primaryDark.withValues(alpha: 0.04),
          blurRadius: 10,
          offset: const Offset(0, 3),
        ),
      ];

  // ---------------------------------------------------------
  // GRADIENTS
  // ---------------------------------------------------------
  static const LinearGradient headerGradient = LinearGradient(
    colors: [primaryDark, primaryMedium],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient brandGradient = LinearGradient(
    colors: [primary, accentDeep],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient splashGradient = LinearGradient(
    colors: [Color(0xFF06120E), Color(0xFF0B3D2E), Color(0xFF0F5238)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient liveCardGradient = LinearGradient(
    colors: [Color(0xFFC62828), Color(0xFFE53935)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFFFD54F), gold, Color(0xFFFF8F00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ---------------------------------------------------------
  // TEXT STYLES
  // ---------------------------------------------------------
  static const TextStyle splashTitle = TextStyle(
    fontSize: 44,
    fontWeight: FontWeight.w900,
    color: Colors.white,
    letterSpacing: 3,
  );

  static const TextStyle headingLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w800,
    color: textPrimary,
    letterSpacing: -0.3,
  );

  static const TextStyle headingMedium = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w700,
    color: textPrimary,
  );

  static const TextStyle headingSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: textPrimary,
  );

  static const TextStyle bodyText = TextStyle(
    fontSize: 14,
    color: textSecondary,
    height: 1.4,
  );

  static const TextStyle labelMuted = TextStyle(
    fontSize: 12,
    color: textMuted,
    fontWeight: FontWeight.w500,
  );

  static const TextStyle scoreLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    color: Colors.white,
  );

  static const TextStyle scoreSmall = TextStyle(
    fontSize: 13,
    color: textOnDarkMuted,
  );

  // ---------------------------------------------------------
  // APP-WIDE ThemeData
  // ---------------------------------------------------------
  static ThemeData get themeData {
    final base = ThemeData(useMaterial3: true, fontFamily: 'Roboto');
    return base.copyWith(
      scaffoldBackgroundColor: scaffold,
      colorScheme: base.colorScheme.copyWith(
        primary: primary,
        secondary: accent,
        error: wicketRed,
        surface: surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.w800,
          color: Colors.white,
          letterSpacing: 0.3,
        ),
        iconTheme: IconThemeData(color: Colors.white),
      ),
      textTheme: base.textTheme.apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
      ),
      dividerTheme: const DividerThemeData(color: divider, thickness: 1),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusSm),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primary, width: 1.4),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusSm),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primary),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accent,
        foregroundColor: Colors.white,
        elevation: 3,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: accent, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: wicketRed, width: 1.2),
        ),
        hintStyle: const TextStyle(color: textMuted),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: surfaceMuted,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusPill),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: accent),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: primaryDark,
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // STATUS HELPERS
  // ---------------------------------------------------------
  static Color statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'live':
        return liveRed;
      case 'completed':
        return completedGreen;
      default:
        return upcomingOrange;
    }
  }

  // ---------------------------------------------------------
  // SCORING HELPERS (kept from original API)
  // ---------------------------------------------------------
  static BoxDecoration ballChipDecoration(String ball) {
    Color bgColor;
    if (ball == '4') {
      bgColor = boundaryGreen;
    } else if (ball == '6') {
      bgColor = sixPurple;
    } else if (ball.toUpperCase() == 'W') {
      bgColor = wicketRed;
    } else if (ball == 'WD' || ball == 'NB') {
      bgColor = extraAmber;
    } else {
      bgColor = Colors.grey.shade500;
    }
    return BoxDecoration(
      color: bgColor,
      shape: BoxShape.circle,
      boxShadow: [
        BoxShadow(
          color: bgColor.withValues(alpha: 0.35),
          blurRadius: 6,
          spreadRadius: 1,
        ),
      ],
    );
  }

  static Color ballChipTextColor(String ball) => Colors.white;

  static String commentaryFor(
      [String ball = '', String batsman = 'Batsman', String bowler = 'Bowler']) {
    switch (ball) {
      case '4':
        return 'FOUR! $batsman drives it beautifully through the covers off $bowler';
      case '6':
        return 'SIX! $batsman launches it into the stands off $bowler!';
      case 'W':
        return 'OUT! $batsman is dismissed by $bowler';
      case 'WD':
        return 'Wide ball bowled by $bowler';
      case 'NB':
        return 'No ball by $bowler';
      case '0':
        return 'Dot ball. $bowler to $batsman';
      default:
        return '$ball run${ball == '1' ? '' : 's'}. $bowler to $batsman';
    }
  }
}

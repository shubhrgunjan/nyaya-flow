import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';

interface StateOption {
  stateName: string;
  districts: string[];
}

const INDIAN_STATES: StateOption[] = [
  { stateName: 'Delhi (NCT)', districts: ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi'] },
  { stateName: 'Maharashtra', districts: ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur'] },
  { stateName: 'Karnataka', districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru'] },
  { stateName: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
  { stateName: 'West Bengal', districts: ['Kolkata', 'North 24 Parganas', 'Howrah', 'Darjeeling'] },
  { stateName: 'Uttar Pradesh', districts: ['Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Lucknow', 'Kanpur'] },
];

export default function LocationOnboardingScreen() {
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const { profile, saveProfileStep } = useAuth();

  const [selectedState, setSelectedState] = useState(profile?.state || 'Delhi (NCT)');
  const [selectedDistrict, setSelectedDistrict] = useState(profile?.district || 'New Delhi');
  const [loading, setLoading] = useState(false);

  const currentStateObj = INDIAN_STATES.find((s) => s.stateName === selectedState) || INDIAN_STATES[0];

  const handleContinue = async () => {
    try {
      setLoading(true);
      await saveProfileStep({
        state: selectedState,
        district: selectedDistrict,
      });
      router.push('/onboarding/completion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Jurisdiction" showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerGroup}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
            Where are you based?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
            Legal procedures and Consumer / Rent Tribunals in India vary by State & District.
          </Text>
        </View>

        {/* State Selector Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select State / Union Territory</Text>
          {INDIAN_STATES.map((st) => {
            const isSelected = selectedState === st.stateName;
            return (
              <TouchableOpacity
                key={st.stateName}
                activeOpacity={0.8}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? colors.accentPrimaryMuted : colors.surface,
                    borderColor: isSelected ? colors.accentPrimary : colors.border,
                    borderRadius: radius.sm,
                  },
                ]}
                onPress={() => {
                  setSelectedState(st.stateName);
                  setSelectedDistrict(st.districts[0]);
                }}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                  {st.stateName}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.accentPrimary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* District Selector Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select District / City</Text>
          <View style={styles.chipRow}>
            {currentStateObj.districts.map((dist) => {
              const isDistSelected = selectedDistrict === dist;
              return (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isDistSelected ? colors.accentPrimary : colors.surfaceHighlight,
                      borderColor: isDistSelected ? colors.accentPrimary : colors.borderSubtle,
                      borderRadius: radius.full,
                    },
                  ]}
                  onPress={() => setSelectedDistrict(dist)}
                >
                  <Text style={[styles.chipText, { color: isDistSelected ? '#FFFFFF' : colors.textPrimary }]}>
                    {dist}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            style={styles.btn}
            onPress={handleContinue}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  headerGroup: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
});

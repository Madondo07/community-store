import { router } from "expo-router";
import { Lock, Mail, User } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthInput, Button } from "@/components/ui";
import { Colors, Radii, Shadows, Spacing, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useResponsive } from "@/hooks/useResponsive";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

// No role picker here — every sign-up becomes a student (the DB trigger
// handle_new_user() defaults role to 'student' when none is passed in
// metadata, see supabase/migrations/0000_baseline_schema.sql). Vendor is
// no longer choosable at sign-up; an existing student becomes a vendor
// later via "Become a Vendor" in the Profile tab, which routes into this
// same vendor-verification flow post-signup — mirroring how admin is
// assigned outside the normal registration flow entirely.
export default function RoleSelectScreen() {
  const { dispatch } = useApp();
  const { isDesktop } = useResponsive();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");

    // Validation
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up with Supabase Auth — pass name as metadata, no role.
      //    The DB trigger (handle_new_user) creates the profile row and
      //    defaults role to 'student' when none is passed.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Check if email confirmation is required
      //    Supabase can be configured to auto-confirm or require email verification
      if (authData.session) {
        // Auto-confirmed — user is signed in immediately
        // Try to fetch the profile (created by the DB trigger)
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        const userProfile: UserProfile = {
          id: authData.user.id,
          email: authData.user.email ?? email,
          full_name: profile?.full_name ?? fullName.trim(),
          role: profile?.role ?? "student",
          avatar_url: profile?.avatar_url ?? null,
          is_verified: profile?.is_verified ?? false,
          created_at: authData.user.created_at,
          business_name: profile?.business_name,
          registration_number: profile?.registration_number,
        };

        dispatch({ type: "SIGN_IN", payload: userProfile });
        router.replace("/(tabs)");
      } else {
        // Email confirmation required — show a message
        Alert.alert(
          "Check your email",
          `We've sent a confirmation link to ${email.trim()}. Please verify your email and then sign in.`,
          [{ text: "OK", onPress: () => router.replace("/(auth)") }],
        );
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isDesktop && styles.scrollDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, isDesktop && styles.formCardDesktop]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Community Store</Text>
              <Text style={styles.subtitle}>
                Your trusted campus marketplace
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <AuthInput
                icon={<User size={20} color={Colors.textTertiary} />}
                placeholder="Full Name"
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  setError("");
                }}
                autoCapitalize="words"
              />
              <AuthInput
                icon={<Mail size={20} color={Colors.textTertiary} />}
                placeholder="Email Address"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                hint="Use your @mycput.ac.za"
              />
              <AuthInput
                icon={<Lock size={20} color={Colors.textTertiary} />}
                placeholder="Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                secureTextEntry
                hint="At least 6 characters"
              />
            </View>

            {/* Error message */}
            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Join Community Store"
              onPress={handleJoin}
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
            />

            <Pressable onPress={() => router.back()} style={styles.linkWrap}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkBold}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: Spacing["2xl"], paddingTop: Spacing["4xl"] },
  scrollDesktop: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%" as any,
  },
  formCard: {},
  formCardDesktop: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing["3xl"],
    maxWidth: 520,
    width: "100%",
    ...Shadows.lg,
  },
  header: { alignItems: "center", marginBottom: Spacing["3xl"] },
  title: { ...Typography.displayLg, color: Colors.navy, textAlign: "center" },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  form: { marginBottom: Spacing.lg },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    textAlign: "center",
  },
  linkWrap: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  linkText: { ...Typography.body, color: Colors.textSecondary },
  linkBold: { color: Colors.blue, fontWeight: "600" },
});

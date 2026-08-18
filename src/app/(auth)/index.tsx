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

export default function SignInScreen() {
  const { dispatch } = useApp();
  const { isDesktop } = useResponsive();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError("Sign in failed. Please try again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        const meta = authData.user.user_metadata;
        const userProfile: UserProfile = {
          id: authData.user.id,
          email: authData.user.email ?? email,
          full_name: meta?.full_name ?? "User",
          role: meta?.role ?? "student",
          avatar_url: null,
          is_verified: false,
          created_at: authData.user.created_at,
        };
        dispatch({ type: "SIGN_IN", payload: userProfile });
      } else {
        const userProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified,
          created_at: profile.created_at,
          business_name: profile.business_name,
          registration_number: profile.registration_number,
          verification_status: profile.verification_status,
        };
        dispatch({ type: "SIGN_IN", payload: userProfile });
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your email address above first, then tap \"Forgot password?\" again.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (resetError) {
      Alert.alert("Error", resetError.message);
      return;
    }
    Alert.alert("Check your email", `We've sent a password reset link to ${email.trim()}.`);
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
        >
          <View style={[styles.formCard, isDesktop && styles.formCardDesktop]}>
            <View style={styles.avatarCircle}>
              <User size={40} color={Colors.textTertiary} />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.form}>
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
                error={error && !email.trim() ? "Email is required" : undefined}
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
                error={
                  error && !password.trim() ? "Password is required" : undefined
                }
              />
              <Pressable style={styles.forgotWrap} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* Error message */}
            {error !== "" && email.trim() !== "" && password.trim() !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Sign In"
              onPress={handleSignIn}
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
            />

            <Pressable
              onPress={() => router.push("/(auth)/sign-up")}
              style={styles.linkWrap}
            >
              <Text style={styles.linkText}>
                Don&apos;t have an account?{" "}
                <Text style={styles.linkBold}>Create one</Text>
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
  scroll: {
    padding: Spacing["2xl"],
    paddingTop: Spacing["5xl"],
    alignItems: "center",
  },
  scrollDesktop: { justifyContent: "center", minHeight: "100%" as any },
  formCard: { width: "100%" },
  formCardDesktop: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing["3xl"],
    maxWidth: 440,
    ...Shadows.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
    alignSelf: "center",
  },
  title: { ...Typography.displayMd, color: Colors.navy, textAlign: "center" },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing["3xl"],
    textAlign: "center",
  },
  form: { width: "100%", marginBottom: Spacing.lg },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  forgotText: {
    ...Typography.bodySmall,
    color: Colors.blue,
    fontWeight: "500",
  },
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
  linkWrap: { alignItems: "center", marginTop: Spacing.xl },
  linkText: { ...Typography.body, color: Colors.textSecondary },
  linkBold: { color: Colors.blue, fontWeight: "600" },
});

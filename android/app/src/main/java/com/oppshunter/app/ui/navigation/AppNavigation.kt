package com.oppshunter.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.oppshunter.app.ui.auth.AuthViewModel
import com.oppshunter.app.ui.auth.ForgotPasswordScreen
import com.oppshunter.app.ui.auth.LoginScreen
import com.oppshunter.app.ui.auth.OnboardingPrefs
import com.oppshunter.app.ui.auth.OnboardingScreen
import com.oppshunter.app.ui.auth.ProfileSetupScreen
import com.oppshunter.app.ui.auth.RecoveryViewModel
import com.oppshunter.app.ui.auth.RegisterScreen
import com.oppshunter.app.ui.auth.ResetPasswordScreen
import com.oppshunter.app.ui.auth.SplashScreen
import com.oppshunter.app.ui.auth.VerifyEmailScreen
import com.oppshunter.app.ui.auth.WelcomeScreen

object Routes {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val FORGOT_PASSWORD = "forgot_password"
    const val RESET_PASSWORD = "reset_password"
    const val VERIFY_EMAIL = "verify_email"
    const val PROFILE_SETUP = "profile_setup"
    const val HOME = "home"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    val recoveryViewModel: RecoveryViewModel = viewModel()
    val context = LocalContext.current
    val onboardingPrefs = remember { OnboardingPrefs(context) }

    NavHost(
        navController = navController,
        startDestination = Routes.SPLASH
    ) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onFinished = {
                    val destination = when {
                        authViewModel.isLoggedIn.value -> Routes.HOME
                        onboardingPrefs.seen -> Routes.WELCOME
                        else -> Routes.ONBOARDING
                    }
                    navController.navigate(destination) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.ONBOARDING) {
            OnboardingScreen(
                onFinished = {
                    onboardingPrefs.seen = true
                    navController.navigate(Routes.WELCOME) {
                        popUpTo(Routes.ONBOARDING) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.WELCOME) {
            WelcomeScreen(
                viewModel = authViewModel,
                onAuthSuccess = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                },
                onContinueWithEmail = {
                    navController.navigate(Routes.LOGIN)
                }
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Routes.REGISTER) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onNavigateToForgotPassword = {
                    navController.navigate(Routes.FORGOT_PASSWORD)
                }
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                viewModel = authViewModel,
                onRegisterSuccess = { email ->
                    recoveryViewModel.startVerification(email)
                    navController.navigate(Routes.VERIFY_EMAIL) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.REGISTER) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.FORGOT_PASSWORD) {
            ForgotPasswordScreen(
                viewModel = recoveryViewModel,
                onCodeSent = {
                    navController.navigate(Routes.RESET_PASSWORD)
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.RESET_PASSWORD) {
            ResetPasswordScreen(
                viewModel = recoveryViewModel,
                onBack = {
                    navController.popBackStack()
                },
                onDone = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.WELCOME)
                    }
                }
            )
        }

        composable(Routes.VERIFY_EMAIL) {
            VerifyEmailScreen(
                viewModel = recoveryViewModel,
                onVerified = {
                    navController.navigate(Routes.PROFILE_SETUP) {
                        popUpTo(Routes.VERIFY_EMAIL) { inclusive = true }
                    }
                },
                onSkip = {
                    navController.navigate(Routes.PROFILE_SETUP) {
                        popUpTo(Routes.VERIFY_EMAIL) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.PROFILE_SETUP) {
            ProfileSetupScreen(
                onNext = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.PROFILE_SETUP) { inclusive = true }
                    }
                },
                onSkip = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.PROFILE_SETUP) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.HOME) {
            HomeScreenPlaceholder(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Routes.WELCOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                }
            )
        }
    }
}

@Composable
private fun HomeScreenPlaceholder(onLogout: () -> Unit) {
    Scaffold { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "You're logged in!",
                    style = MaterialTheme.typography.headlineSmall
                )
                TextButton(onClick = onLogout) {
                    Text("Log out")
                }
            }
        }
    }
}
package com.oppshunter.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.oppshunter.app.features.auth.ui.AuthViewModel
import com.oppshunter.app.features.auth.ui.ForgotPasswordScreen
import com.oppshunter.app.features.auth.ui.LoginScreen
import com.oppshunter.app.features.auth.ui.RecoveryViewModel
import com.oppshunter.app.features.auth.ui.RegisterScreen
import com.oppshunter.app.features.auth.ui.ResetCodeScreen
import com.oppshunter.app.features.auth.ui.ResetPasswordScreen
import com.oppshunter.app.features.auth.ui.VerifyEmailScreen
import com.oppshunter.app.features.auth.ui.WelcomeScreen
import com.oppshunter.app.features.dashboard.DashboardScreen
import com.oppshunter.app.features.onboarding.OnboardingPrefs
import com.oppshunter.app.features.onboarding.OnboardingScreen
import com.oppshunter.app.features.onboarding.SplashScreen
import com.oppshunter.app.features.profile.ui.ProfileSetupScreen
import com.oppshunter.app.features.profile.ui.ProfileViewModel
import com.oppshunter.app.features.settings.SettingsScreen
import com.oppshunter.app.ui.components.ComingSoonScreen
import com.oppshunter.app.ui.components.MainTab

private val mainRoutes = setOf(
    Routes.HOME,
    Routes.APPLICATIONS,
    Routes.SEARCH,
    Routes.ALERTS,
    Routes.SETTINGS
)

private fun MainTab.route(): String = when (this) {
    MainTab.HOME -> Routes.HOME
    MainTab.APPLICATIONS -> Routes.APPLICATIONS
    MainTab.SEARCH -> Routes.SEARCH
    MainTab.ALERTS -> Routes.ALERTS
    MainTab.SETTINGS -> Routes.SETTINGS
}

private fun NavHostController.navigateToTab(tab: MainTab) {
    navigate(tab.route()) {
        popUpTo(Routes.HOME) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    val recoveryViewModel: RecoveryViewModel = viewModel()
    val profileViewModel: ProfileViewModel = viewModel()
    val context = LocalContext.current
    val onboardingPrefs = remember { OnboardingPrefs(context) }
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val profileState by profileViewModel.state.collectAsState()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            onboardingPrefs.hasAccount = true
            profileViewModel.load()
        } else {
            profileViewModel.clear()
        }
    }

    LaunchedEffect(isLoggedIn, currentRoute) {
        if (!isLoggedIn && currentRoute in mainRoutes) {
            navController.navigate(Routes.WELCOME) {
                popUpTo(Routes.HOME) { inclusive = true }
            }
        }
    }

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
                    val destination = if (onboardingPrefs.hasAccount) {
                        Routes.LOGIN
                    } else {
                        Routes.REGISTER
                    }
                    navController.navigate(destination)
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
                    navController.navigate(Routes.RESET_CODE)
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.RESET_CODE) {
            ResetCodeScreen(
                viewModel = recoveryViewModel,
                onBack = {
                    navController.popBackStack()
                },
                onVerified = {
                    navController.navigate(Routes.RESET_PASSWORD) {
                        popUpTo(Routes.RESET_CODE) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.RESET_PASSWORD) {
            ResetPasswordScreen(
                viewModel = recoveryViewModel,
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
                viewModel = profileViewModel,
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
            DashboardScreen(
                userName = profileState.displayName?.substringBefore(' ').orEmpty(),
                onTabSelected = { navController.navigateToTab(it) }
            )
        }

        composable(Routes.APPLICATIONS) {
            ComingSoonScreen(
                tab = MainTab.APPLICATIONS,
                onTabSelected = { navController.navigateToTab(it) }
            )
        }

        composable(Routes.SEARCH) {
            ComingSoonScreen(
                tab = MainTab.SEARCH,
                onTabSelected = { navController.navigateToTab(it) }
            )
        }

        composable(Routes.ALERTS) {
            ComingSoonScreen(
                tab = MainTab.ALERTS,
                onTabSelected = { navController.navigateToTab(it) }
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onTabSelected = { navController.navigateToTab(it) },
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
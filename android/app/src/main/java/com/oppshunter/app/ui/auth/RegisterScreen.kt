package com.oppshunter.app.ui.auth

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.oppshunter.app.ui.auth.components.AuthBackground
import com.oppshunter.app.ui.auth.components.AuthTextField
import com.oppshunter.app.ui.auth.components.ErrorText
import com.oppshunter.app.ui.auth.components.PrimaryButton
import com.oppshunter.app.ui.auth.components.SwitchAuthRow
import com.oppshunter.app.ui.auth.components.TermsFooter
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun RegisterScreen(
    viewModel: AuthViewModel = viewModel(),
    onRegisterSuccess: (String) -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf<String?>(null) }

    val passwordsMismatch = confirmPassword.isNotEmpty() && password != confirmPassword

    LaunchedEffect(Unit) { viewModel.clearError() }
    LaunchedEffect(isLoggedIn) { if (isLoggedIn) onRegisterSuccess(email.trim()) }

    AuthBackground {
        Spacer(modifier = Modifier.height(72.dp))

        Text(
            text = "Create your account",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Let your AI agent do the job hunting",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(40.dp))

        AuthTextField(
            label = "Email",
            value = email,
            onValueChange = {
                email = it
                formError = null
            },
            placeholder = "Enter your email",
            keyboardType = KeyboardType.Email
        )

        Spacer(modifier = Modifier.height(20.dp))

        AuthTextField(
            label = "Password",
            value = password,
            onValueChange = {
                password = it
                formError = null
            },
            placeholder = "Letters & numbers, 8+ characters",
            isPassword = true
        )

        Spacer(modifier = Modifier.height(20.dp))

        AuthTextField(
            label = "Confirm password",
            value = confirmPassword,
            onValueChange = {
                confirmPassword = it
                formError = null
            },
            placeholder = "Re-enter your password",
            imeAction = ImeAction.Done,
            isPassword = true
        )

        ErrorText(
            message = when {
                passwordsMismatch -> "Passwords don't match"
                formError != null -> formError
                else -> state.errorMessage
            }
        )

        Spacer(modifier = Modifier.height(32.dp))

        PrimaryButton(
            text = "Sign up",
            isLoading = state.isLoading,
            enabled = email.isNotBlank() &&
                    password.isNotBlank() &&
                    confirmPassword.isNotBlank() &&
                    !passwordsMismatch,
            onClick = {
                formError = if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                    "Enter a valid email address"
                } else {
                    PasswordRules.validate(password)
                }

                if (formError == null) viewModel.register(email, password)
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        SwitchAuthRow(
            prompt = "Already have an account?",
            action = "Sign in",
            onClick = onNavigateToLogin
        )

        Spacer(modifier = Modifier.height(24.dp))

        TermsFooter()
    }
}
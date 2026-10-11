package com.oppshunter.app.features.auth.ui

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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.features.auth.ui.components.AuthBackground
import com.oppshunter.app.features.auth.ui.components.AuthTextField
import com.oppshunter.app.features.auth.ui.components.ErrorText
import com.oppshunter.app.features.auth.ui.components.PrimaryButton
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun ResetPasswordScreen(
    viewModel: RecoveryViewModel,
    onDone: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf<String?>(null) }
    var success by rememberSaveable { mutableStateOf(false) }

    val passwordsMismatch = confirmPassword.isNotEmpty() && password != confirmPassword

    LaunchedEffect(Unit) {
        viewModel.clearError()
        viewModel.events.collect { event ->
            if (event is RecoveryEvent.PasswordReset) success = true
        }
    }

    AuthBackground {
        Spacer(modifier = Modifier.height(120.dp))

        Text(
            text = if (success) "Password updated" else "New password",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = if (success) {
                "You've been signed out on all devices. Sign in with your new password."
            } else {
                "Choose a new password for your account"
            },
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(48.dp))

        if (success) {
            PrimaryButton(text = "Go to sign in", onClick = onDone)
        } else {
            AuthTextField(
                label = "New password",
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
                label = "Confirm new password",
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
                text = "Reset password",
                isLoading = state.isSubmitting,
                enabled = password.isNotBlank() && confirmPassword.isNotBlank() && !passwordsMismatch,
                onClick = {
                    val error = PasswordRules.validate(password)
                    if (error != null) {
                        formError = error
                    } else {
                        viewModel.resetPassword(password)
                    }
                }
            )
        }
    }
}
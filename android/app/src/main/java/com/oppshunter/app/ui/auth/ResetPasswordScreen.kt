package com.oppshunter.app.ui.auth

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.auth.components.AuthBackground
import com.oppshunter.app.ui.auth.components.AuthTextField
import com.oppshunter.app.ui.auth.components.CodeTextField
import com.oppshunter.app.ui.auth.components.ErrorText
import com.oppshunter.app.ui.auth.components.PrimaryButton
import com.oppshunter.app.ui.auth.components.ResendCodeRow
import com.oppshunter.app.ui.auth.components.rememberResendCooldown
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun ResetPasswordScreen(
    viewModel: RecoveryViewModel,
    onBack: () -> Unit,
    onDone: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val secondsLeft = rememberResendCooldown(state.sendCount)

    var code by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf<String?>(null) }
    var success by rememberSaveable { mutableStateOf(false) }

    val passwordsMismatch = confirmPassword.isNotEmpty() && password != confirmPassword
    val target = state.email.ifBlank { "your email" }

    LaunchedEffect(Unit) {
        viewModel.clearError()
        viewModel.events.collect { event ->
            if (event is RecoveryEvent.PasswordReset) success = true
        }
    }

    AuthBackground {
        if (success) {
            Spacer(modifier = Modifier.height(120.dp))

            Text(
                text = "Password updated",
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.displaySmall,
                color = TextPrimary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "You've been signed out on all devices. Sign in with your new password.",
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(48.dp))

            PrimaryButton(text = "Go to sign in", onClick = onDone)
        } else {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TextPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Reset password",
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.displaySmall,
                color = TextPrimary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "If an account exists for $target, we've sent a 6-digit code. It expires in 15 minutes.",
                modifier = Modifier.fillMaxWidth(),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(40.dp))

            CodeTextField(
                label = "Verification code",
                value = code,
                onValueChange = {
                    code = it
                    formError = null
                }
            )

            Spacer(modifier = Modifier.height(20.dp))

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
                enabled = code.length == 6 &&
                        password.isNotBlank() &&
                        confirmPassword.isNotBlank() &&
                        !passwordsMismatch,
                onClick = {
                    val error = PasswordRules.validate(password)
                    if (error != null) {
                        formError = error
                    } else {
                        viewModel.resetPassword(code, password)
                    }
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            ResendCodeRow(
                secondsLeft = secondsLeft,
                isSending = state.isSending,
                onResend = viewModel::resendPasswordResetCode
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
package com.oppshunter.app.features.auth.ui

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
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.features.auth.ui.components.AuthBackground
import com.oppshunter.app.features.auth.ui.components.CodeTextField
import com.oppshunter.app.features.auth.ui.components.ErrorText
import com.oppshunter.app.features.auth.ui.components.PrimaryButton
import com.oppshunter.app.features.auth.ui.components.ResendCodeRow
import com.oppshunter.app.features.auth.ui.components.rememberResendCooldown
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun ResetCodeScreen(
    viewModel: RecoveryViewModel,
    onBack: () -> Unit,
    onVerified: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val currentOnVerified by rememberUpdatedState(onVerified)
    val secondsLeft = rememberResendCooldown(state.sendCount)

    var code by remember { mutableStateOf("") }

    val target = state.email.ifBlank { "your email" }

    LaunchedEffect(Unit) {
        viewModel.clearError()
        viewModel.events.collect { event ->
            if (event is RecoveryEvent.CodeVerified) currentOnVerified()
        }
    }

    AuthBackground {
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

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Enter the code",
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
            onValueChange = { code = it }
        )

        ErrorText(message = state.errorMessage)

        Spacer(modifier = Modifier.height(32.dp))

        PrimaryButton(
            text = "Continue",
            isLoading = state.isSubmitting,
            enabled = code.length == 6,
            onClick = { viewModel.verifyResetCode(code) }
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
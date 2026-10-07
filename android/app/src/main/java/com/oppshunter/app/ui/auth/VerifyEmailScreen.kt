package com.oppshunter.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.auth.components.AuthBackground
import com.oppshunter.app.ui.auth.components.CodeTextField
import com.oppshunter.app.ui.auth.components.ErrorText
import com.oppshunter.app.ui.auth.components.PrimaryButton
import com.oppshunter.app.ui.auth.components.ResendCodeRow
import com.oppshunter.app.ui.auth.components.rememberResendCooldown
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun VerifyEmailScreen(
    viewModel: RecoveryViewModel,
    onVerified: () -> Unit,
    onSkip: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val currentOnVerified by rememberUpdatedState(onVerified)
    val secondsLeft = rememberResendCooldown(state.sendCount)

    var code by remember { mutableStateOf("") }

    val target = state.email.ifBlank { "your email" }
    val subtitle = when {
        state.isSending && state.sendCount == 0 -> "Sending a 6-digit code to $target..."
        state.sendCount > 0 -> "We sent a 6-digit code to $target. It expires in 15 minutes."
        else -> "Enter the 6-digit code we email you to confirm $target."
    }

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            if (event is RecoveryEvent.EmailVerified) currentOnVerified()
        }
    }

    AuthBackground {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onSkip) {
                Text(
                    text = "Skip",
                    style = MaterialTheme.typography.labelLarge,
                    color = TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(Primary.copy(alpha = 0.12f))
                .align(Alignment.CenterHorizontally),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Email,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(44.dp)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Verify your email",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = subtitle,
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
            text = "Verify",
            isLoading = state.isSubmitting,
            enabled = code.length == 6,
            onClick = { viewModel.verifyEmail(code) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        ResendCodeRow(
            secondsLeft = secondsLeft,
            isSending = state.isSending,
            onResend = viewModel::sendVerificationCode
        )

        Spacer(modifier = Modifier.height(24.dp))
    }
}
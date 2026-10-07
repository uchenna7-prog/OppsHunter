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
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.auth.components.AuthBackground
import com.oppshunter.app.ui.auth.components.AuthTextField
import com.oppshunter.app.ui.auth.components.ErrorText
import com.oppshunter.app.ui.auth.components.PrimaryButton
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun ForgotPasswordScreen(
    viewModel: RecoveryViewModel,
    onCodeSent: () -> Unit,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val currentOnCodeSent by rememberUpdatedState(onCodeSent)

    var email by rememberSaveable { mutableStateOf("") }
    var formError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        viewModel.clear()
        viewModel.events.collect { event ->
            if (event is RecoveryEvent.CodeSent) currentOnCodeSent()
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

        Spacer(modifier = Modifier.height(40.dp))

        Text(
            text = "Forgot password?",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Enter your email and we'll send you a 6-digit code to reset your password",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(48.dp))

        AuthTextField(
            label = "Email",
            value = email,
            onValueChange = {
                email = it
                formError = null
            },
            placeholder = "Enter your email",
            keyboardType = KeyboardType.Email,
            imeAction = ImeAction.Done
        )

        ErrorText(message = formError ?: state.errorMessage)

        Spacer(modifier = Modifier.height(32.dp))

        PrimaryButton(
            text = "Send code",
            isLoading = state.isSending,
            enabled = email.isNotBlank(),
            onClick = {
                if (android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                    viewModel.requestPasswordReset(email.trim())
                } else {
                    formError = "Enter a valid email address"
                }
            }
        )
    }
}
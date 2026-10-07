package com.oppshunter.app.ui.auth

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.clip
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
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun LoginScreen(
    viewModel: AuthViewModel = viewModel(),
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onNavigateToForgotPassword: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.clearError() }
    LaunchedEffect(isLoggedIn) { if (isLoggedIn) onLoginSuccess() }

    AuthBackground {
        Spacer(modifier = Modifier.height(96.dp))

        Text(
            text = "Welcome back",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Sign in to keep hunting opportunities",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(48.dp))

        AuthTextField(
            label = "Email",
            value = email,
            onValueChange = { email = it },
            placeholder = "Enter your email",
            keyboardType = KeyboardType.Email
        )

        Spacer(modifier = Modifier.height(20.dp))

        AuthTextField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            placeholder = "Enter your password",
            imeAction = ImeAction.Done,
            isPassword = true
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.End
        ) {
            Text(
                text = "Forgot password?",
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .clickable(onClick = onNavigateToForgotPassword)
                    .padding(vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                color = Primary
            )
        }

        ErrorText(message = state.errorMessage)

        Spacer(modifier = Modifier.height(24.dp))

        PrimaryButton(
            text = "Sign in",
            isLoading = state.isLoading,
            enabled = email.isNotBlank() && password.isNotBlank(),
            onClick = { viewModel.login(email, password) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        SwitchAuthRow(
            prompt = "Don't have an account?",
            action = "Sign up",
            onClick = onNavigateToRegister
        )

        Spacer(modifier = Modifier.height(32.dp))

        TermsFooter()
    }
}
package com.oppshunter.app.features.profile.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.features.auth.ui.components.ErrorText
import com.oppshunter.app.features.auth.ui.components.PrimaryButton
import com.oppshunter.app.ui.theme.Border
import com.oppshunter.app.ui.theme.InputFill
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextHint
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

@Composable
fun ProfileSetupScreen(
    viewModel: ProfileViewModel,
    onNext: () -> Unit,
    onSkip: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val currentOnNext by rememberUpdatedState(onNext)

    var nickname by rememberSaveable { mutableStateOf("") }
    val initial = nickname.trim().firstOrNull()?.uppercase() ?: "U"

    LaunchedEffect(Unit) {
        viewModel.clearError()
        viewModel.events.collect { event ->
            if (event is ProfileEvent.Saved) currentOnNext()
        }
    }

    LaunchedEffect(state.displayName) {
        val loaded = state.displayName
        if (nickname.isEmpty() && !loaded.isNullOrBlank()) nickname = loaded
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .systemBarsPadding()
            .padding(horizontal = 24.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.End
        ) {
            OutlinedButton(
                onClick = onSkip,
                shape = CircleShape,
                border = BorderStroke(1.dp, Border)
            ) {
                Text(
                    text = "Skip",
                    style = MaterialTheme.typography.labelLarge,
                    color = TextPrimary
                )
            }
        }

        Spacer(modifier = Modifier.height(48.dp))

        Text(
            text = "Set up profile",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Tell me what to call you",
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(40.dp))

        Box(modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Box(
                modifier = Modifier
                    .size(112.dp)
                    .clip(CircleShape)
                    .background(Primary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initial,
                    style = MaterialTheme.typography.displaySmall,
                    color = Color.White
                )
            }
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(TextPrimary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.CameraAlt,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(40.dp))

        TextField(
            value = nickname,
            onValueChange = { if (it.length <= 30) nickname = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(text = "Your name", color = TextHint) },
            singleLine = true,
            shape = RoundedCornerShape(20.dp),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            trailingIcon = {
                Text(
                    text = "${nickname.length}/30",
                    modifier = Modifier.padding(end = 16.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextHint
                )
            },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = InputFill,
                unfocusedContainerColor = InputFill,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = Primary
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "You can change your name once every 7 days",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary
        )

        ErrorText(message = state.errorMessage)

        Spacer(modifier = Modifier.weight(1f))

        PrimaryButton(
            text = "Next",
            isLoading = state.isSaving,
            enabled = nickname.isNotBlank(),
            onClick = { viewModel.saveDisplayName(nickname.trim()) }
        )

        Spacer(modifier = Modifier.height(32.dp))
    }
}
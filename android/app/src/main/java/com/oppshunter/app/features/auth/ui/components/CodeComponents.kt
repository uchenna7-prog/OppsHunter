package com.oppshunter.app.features.auth.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oppshunter.app.ui.theme.InputFill
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextHint
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary
import kotlinx.coroutines.delay

@Composable
fun CodeTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val codeStyle = MaterialTheme.typography.headlineMedium.copy(
        textAlign = TextAlign.Center,
        letterSpacing = 8.sp
    )

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = TextSecondary
        )
        Spacer(modifier = Modifier.height(8.dp))
        TextField(
            value = value,
            onValueChange = { input ->
                onValueChange(input.filter { it in '0'..'9' }.take(6))
            },
            modifier = Modifier.fillMaxWidth(),
            textStyle = codeStyle,
            placeholder = {
                Text(
                    text = "000000",
                    modifier = Modifier.fillMaxWidth(),
                    style = codeStyle,
                    color = TextHint
                )
            },
            singleLine = true,
            shape = RoundedCornerShape(28.dp),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Done
            ),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = InputFill,
                unfocusedContainerColor = InputFill,
                disabledContainerColor = InputFill,
                errorContainerColor = InputFill,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                errorIndicatorColor = Color.Transparent,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = Primary
            )
        )
    }
}

@Composable
fun rememberResendCooldown(sendCount: Int, seconds: Int = 60): Int {
    var secondsLeft by remember { mutableIntStateOf(0) }

    LaunchedEffect(sendCount) {
        if (sendCount > 0) {
            secondsLeft = seconds
            while (secondsLeft > 0) {
                delay(1000)
                secondsLeft -= 1
            }
        }
    }

    return secondsLeft
}

@Composable
fun ResendCodeRow(
    secondsLeft: Int,
    isSending: Boolean,
    onResend: () -> Unit,
    modifier: Modifier = Modifier
) {
    val enabled = secondsLeft == 0 && !isSending

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Didn't get the code?",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )
        Text(
            text = if (secondsLeft > 0) " Resend in ${secondsLeft}s" else " Resend",
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .clickable(enabled = enabled, onClick = onResend)
                .padding(vertical = 8.dp),
            style = MaterialTheme.typography.labelLarge,
            color = if (enabled) Primary else TextHint
        )
    }
}
package com.oppshunter.app.features.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.components.MainScaffold
import com.oppshunter.app.ui.components.MainTab
import com.oppshunter.app.ui.theme.TextHint

private val CardRadius = 12.dp
private val IconBoxRadius = 10.dp

private data class SettingsItem(
    val icon: ImageVector,
    val title: String,
    val subtitle: String
)

private val items = listOf(
    SettingsItem(Icons.Outlined.Person, "Profile", "Your name, photo and CV"),
    SettingsItem(Icons.Outlined.Tune, "Opportunity preferences", "Fields, locations and types"),
    SettingsItem(Icons.Outlined.Notifications, "Notifications", "Choose what I alert you about"),
    SettingsItem(Icons.Outlined.Lock, "Privacy and security", "Password and connected accounts"),
    SettingsItem(Icons.Outlined.Info, "Help and support", "Questions, feedback and legal")
)

@Composable
private fun borderColor(): Color {
    val colors = MaterialTheme.colorScheme
    return if (colors.background.luminance() < 0.5f) colors.outline.copy(alpha = 0.35f) else colors.outline
}

@Composable
fun SettingsScreen(
    onTabSelected: (MainTab) -> Unit,
    onLogout: () -> Unit
) {
    val colors = MaterialTheme.colorScheme
    val border = borderColor()
    val cardShape = RoundedCornerShape(CardRadius)

    MainScaffold(
        selected = MainTab.PROFILE,
        onTabSelected = onTabSelected
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(
                start = 20.dp,
                end = 20.dp,
                top = 16.dp,
                bottom = 24.dp
            )
        ) {
            item {
                Text(
                    text = "Settings",
                    style = MaterialTheme.typography.displaySmall,
                    color = colors.onBackground
                )
                Spacer(modifier = Modifier.height(24.dp))
                AccountCard()
                Spacer(modifier = Modifier.height(16.dp))
            }

            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(cardShape)
                        .background(colors.surface)
                        .border(1.dp, border, cardShape)
                ) {
                    items.forEachIndexed { index, item ->
                        SettingsRow(item)

                        if (index != items.lastIndex) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 70.dp)
                                    .height(1.dp)
                                    .background(border)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            item {
                Text(
                    text = "Log out",
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(cardShape)
                        .background(colors.surface)
                        .border(1.dp, border, cardShape)
                        .clickable(onClick = onLogout)
                        .padding(vertical = 16.dp),
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.error,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun AccountCard() {
    val colors = MaterialTheme.colorScheme
    val shape = RoundedCornerShape(CardRadius)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.surface)
            .border(1.dp, borderColor(), shape)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(colors.primary, colors.secondary))),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "U",
                style = MaterialTheme.typography.headlineSmall,
                color = colors.onPrimary
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column {
            Text(
                text = "Your account",
                style = MaterialTheme.typography.titleMedium,
                color = colors.onSurface
            )
            Text(
                text = "Manage your profile and preferences",
                style = MaterialTheme.typography.bodySmall,
                color = colors.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SettingsRow(item: SettingsItem) {
    val colors = MaterialTheme.colorScheme

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {}
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(IconBoxRadius))
                .background(colors.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = null,
                tint = colors.onPrimaryContainer,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.onSurface
            )
            Text(
                text = item.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = colors.onSurfaceVariant
            )
        }

        Icon(
            imageVector = Icons.Filled.ChevronRight,
            contentDescription = null,
            tint = TextHint
        )
    }
}
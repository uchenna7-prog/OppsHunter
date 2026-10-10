package com.oppshunter.app.features.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.theme.Accent
import com.oppshunter.app.ui.theme.Border
import com.oppshunter.app.ui.theme.InputFill
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.PrimaryContainer
import com.oppshunter.app.ui.theme.TextHint
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary

private val CardShadow = Color(0x332563EB)

@Composable
internal fun DashboardHeader(userName: String) {
    val initial = userName.trim().firstOrNull()?.uppercase() ?: "U"

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Welcome back",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            Text(
                text = if (userName.isBlank()) "Hi there" else "Hi, $userName",
                style = MaterialTheme.typography.displaySmall,
                color = TextPrimary
            )
        }

        Box(
            modifier = Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Primary, Accent))),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initial,
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }
    }
}

@Composable
internal fun AgentStatusPill(newMatches: Int) {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(PrimaryContainer)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(Primary)
        )

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = "Agent active",
            style = MaterialTheme.typography.labelMedium,
            color = Primary
        )

        Text(
            text = "  ·  $newMatches new matches",
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Normal),
            color = TextSecondary
        )
    }
}

@Composable
internal fun FilterRow(
    selected: OpportunityFilter,
    onSelected: (OpportunityFilter) -> Unit
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(OpportunityFilter.values().toList()) { filter ->
            val isSelected = filter == selected

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (isSelected) Primary else Color.White)
                    .border(1.dp, if (isSelected) Primary else Border, CircleShape)
                    .clickable { onSelected(filter) }
                    .padding(horizontal = 18.dp, vertical = 10.dp)
            ) {
                Text(
                    text = filter.label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (isSelected) Color.White else TextSecondary
                )
            }
        }
    }
}

@Composable
internal fun OpportunityCard(
    opportunity: Opportunity,
    saved: Boolean,
    onToggleSaved: () -> Unit
) {
    val shape = RoundedCornerShape(24.dp)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 4.dp,
                shape = shape,
                ambientColor = CardShadow,
                spotColor = CardShadow
            )
            .clip(shape)
            .background(Color.White)
            .clickable {}
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Brush.linearGradient(listOf(Primary, Accent))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = opportunity.organization.take(1).uppercase(),
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = opportunity.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = opportunity.organization,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            IconButton(
                onClick = onToggleSaved,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = if (saved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                    contentDescription = if (saved) "Remove from saved" else "Save",
                    tint = if (saved) Primary else TextHint
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TypeChip(label = opportunity.type.label)
            LocationChip(
                location = opportunity.location,
                modifier = Modifier.weight(1f, fill = false)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(Border)
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .width(64.dp)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(PrimaryContainer)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(opportunity.matchPercent / 100f)
                        .clip(CircleShape)
                        .background(Primary)
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = "${opportunity.matchPercent}% match",
                style = MaterialTheme.typography.labelLarge,
                color = Primary,
                maxLines = 1
            )

            Spacer(modifier = Modifier.weight(1f))

            Icon(
                imageVector = Icons.Outlined.Schedule,
                contentDescription = null,
                tint = TextHint,
                modifier = Modifier.size(15.dp)
            )

            Spacer(modifier = Modifier.width(4.dp))

            Text(
                text = opportunity.deadline,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun TypeChip(label: String) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(PrimaryContainer)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = Primary,
            maxLines = 1
        )
    }
}

@Composable
private fun LocationChip(
    location: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(InputFill)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Outlined.LocationOn,
            contentDescription = null,
            tint = TextSecondary,
            modifier = Modifier.size(14.dp)
        )

        Spacer(modifier = Modifier.width(4.dp))

        Text(
            text = location,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Medium),
            color = TextSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
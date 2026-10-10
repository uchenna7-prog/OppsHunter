package com.oppshunter.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextHint

enum class MainTab(
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector
) {
    HOME("Home", Icons.Outlined.Home, Icons.Filled.Home),
    APPLICATIONS("Applied", Icons.Outlined.Description, Icons.Filled.Description),
    SEARCH("Search", Icons.Filled.Search, Icons.Filled.Search),
    ALERTS("Alerts", Icons.Outlined.Notifications, Icons.Filled.Notifications),
    SETTINGS("Settings", Icons.Outlined.Settings, Icons.Filled.Settings)
}

@Composable
fun AppBottomBar(
    selected: MainTab,
    onTabSelected: (MainTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 12.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .height(72.dp)
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BarItem(MainTab.HOME, selected == MainTab.HOME) { onTabSelected(MainTab.HOME) }
            BarItem(MainTab.APPLICATIONS, selected == MainTab.APPLICATIONS) {
                onTabSelected(MainTab.APPLICATIONS)
            }

            Box(
                modifier = Modifier
                    .weight(1.5f)
                    .fillMaxHeight(),
                contentAlignment = Alignment.Center
            ) {
                SearchButton(onClick = { onTabSelected(MainTab.SEARCH) })
            }

            BarItem(MainTab.ALERTS, selected == MainTab.ALERTS) { onTabSelected(MainTab.ALERTS) }
            BarItem(MainTab.SETTINGS, selected == MainTab.SETTINGS) {
                onTabSelected(MainTab.SETTINGS)
            }
        }
    }
}

@Composable
private fun RowScope.BarItem(
    tab: MainTab,
    selected: Boolean,
    onClick: () -> Unit
) {
    val tint by animateColorAsState(
        targetValue = if (selected) Primary else TextHint,
        label = "tabTint"
    )

    Column(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = if (selected) tab.selectedIcon else tab.icon,
            contentDescription = tab.label,
            tint = tint,
            modifier = Modifier.size(26.dp)
        )

        Spacer(modifier = Modifier.height(5.dp))

        Box(
            modifier = Modifier
                .size(4.dp)
                .clip(CircleShape)
                .background(if (selected) Primary else Color.Transparent)
        )
    }
}

@Composable
private fun SearchButton(onClick: () -> Unit) {
    val shape = RoundedCornerShape(16.dp)

    Box(
        modifier = Modifier
            .width(76.dp)
            .height(46.dp)
            .shadow(
                elevation = 8.dp,
                shape = shape,
                ambientColor = Primary,
                spotColor = Primary
            )
            .clip(shape)
            .background(Primary)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Search,
            contentDescription = "Search",
            tint = Color.White,
            modifier = Modifier.size(26.dp)
        )
    }
}
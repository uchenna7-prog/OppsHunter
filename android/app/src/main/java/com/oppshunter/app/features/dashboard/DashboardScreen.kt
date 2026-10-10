package com.oppshunter.app.features.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.oppshunter.app.ui.components.MainScaffold
import com.oppshunter.app.ui.components.MainTab

@Composable
fun DashboardScreen(
    userName: String = "",
    onTabSelected: (MainTab) -> Unit
) {
    var filter by remember { mutableStateOf(OpportunityFilter.ALL) }
    var savedIds by remember { mutableStateOf(emptySet<String>()) }

    val visible = remember(filter) {
        DashboardSampleData.opportunities.filter { filter.type == null || it.type == filter.type }
    }

    MainScaffold(
        selected = MainTab.HOME,
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
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { DashboardHeader(userName = userName) }
            item { AgentStatusPill(newMatches = 12) }
            item {
                FilterRow(
                    selected = filter,
                    onSelected = { filter = it }
                )
            }
            items(items = visible, key = { it.id }) { opportunity ->
                OpportunityCard(
                    opportunity = opportunity,
                    saved = opportunity.id in savedIds,
                    onToggleSaved = {
                        savedIds = if (opportunity.id in savedIds) {
                            savedIds - opportunity.id
                        } else {
                            savedIds + opportunity.id
                        }
                    }
                )
            }
        }
    }
}
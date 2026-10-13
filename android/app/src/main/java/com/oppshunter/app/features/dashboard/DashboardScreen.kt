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

private val ScreenPadding = 20.dp

@Composable
fun DashboardScreen(
    onTabSelected: (MainTab) -> Unit
) {
    var query by remember { mutableStateOf("") }
    var filter by remember { mutableStateOf(OpportunityFilter.ALL) }
    var savedIds by remember { mutableStateOf(emptySet<String>()) }

    val visible = remember(filter, query) {
        val term = query.trim()

        DashboardSampleData.opportunities.filter { opportunity ->
            val matchesType = filter.type == null || opportunity.type == filter.type
            val matchesQuery = term.isEmpty() ||
                    opportunity.title.contains(term, ignoreCase = true) ||
                    opportunity.organization.contains(term, ignoreCase = true)

            matchesType && matchesQuery
        }
    }

    val horizontal = Modifier.padding(horizontal = ScreenPadding)

    MainScaffold(
        selected = MainTab.HOME,
        onTabSelected = onTabSelected
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(top = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                DashboardHeader(
                    onNotificationsClick = {},
                    modifier = horizontal
                )
            }

            item {
                SearchField(
                    query = query,
                    onQueryChange = { query = it },
                    modifier = horizontal
                )
            }

            item {
                FilterRow(
                    selected = filter,
                    onSelected = { filter = it }
                )
            }

            item {
                SectionHeader(
                    title = "Recommended for you",
                    count = visible.size,
                    modifier = horizontal
                )
            }

            if (visible.isEmpty()) {
                item { EmptyState(modifier = horizontal) }
            } else {
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
                        },
                        onClick = {},
                        modifier = horizontal
                    )
                }
            }
        }
    }
}
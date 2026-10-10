package com.oppshunter.app.ui.components

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.oppshunter.app.ui.theme.ScreenBackground

@Composable
fun MainScaffold(
    selected: MainTab,
    onTabSelected: (MainTab) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        modifier = modifier,
        containerColor = ScreenBackground,
        bottomBar = {
            AppBottomBar(
                selected = selected,
                onTabSelected = onTabSelected
            )
        },
        content = content
    )
}
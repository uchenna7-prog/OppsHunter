package com.oppshunter.app.features.onboarding

import androidx.annotation.DrawableRes
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.oppshunter.app.R
import com.oppshunter.app.ui.theme.Border
import com.oppshunter.app.ui.theme.GradientMid
import com.oppshunter.app.ui.theme.GradientTop
import com.oppshunter.app.ui.theme.Primary
import com.oppshunter.app.ui.theme.TextPrimary
import com.oppshunter.app.ui.theme.TextSecondary
import kotlinx.coroutines.launch

private data class OnboardingPage(
    @DrawableRes val image: Int,
    val title: String,
    val body: String
)
private val pages = listOf(
    OnboardingPage(
        image = R.drawable.agent_wave,
        title = "Hi there!",
        body = "I'm your AI opportunity hunter. Internships, jobs, grants and more. I never sleep, so you don't have to search alone."
    ),
    OnboardingPage(
        image = R.drawable.agent_search,
        title = "Tell me what you're after",
        body = "Share your goals, field and location once. I'll search the web for opportunities that fit you."
    ),
    OnboardingPage(
        image = R.drawable.agent_documents,
        title = "Applications, ready to send",
        body = "I'll draft a tailored CV, cover letter and application for each opportunity, in your voice."
    ),
    OnboardingPage(
        image = R.drawable.agent_notify,
        title = "You stay in charge",
        body = "Approve everything before it goes out. I'll notify you the moment a great opportunity appears."
    )
)

@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    val pagerState = rememberPagerState { pages.size }
    val scope = rememberCoroutineScope()
    val isLast = pagerState.currentPage == pages.lastIndex
    val buttonWidth by animateDpAsState(
        targetValue = if (isLast) 168.dp else 56.dp,
        label = "buttonWidth"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    0f to GradientTop,
                    0.5f to GradientMid,
                    1f to Color.White
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(horizontal = 24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (!isLast) {
                    TextButton(onClick = onFinished) {
                        Text(
                            text = "Skip",
                            style = MaterialTheme.typography.labelLarge,
                            color = TextSecondary
                        )
                    }
                }
            }

            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) { index ->
                val page = pages[index]

                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        painter = painterResource(id = page.image),
                        contentDescription = null,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        contentScale = ContentScale.Fit
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = page.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = TextPrimary,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = page.body,
                            style = MaterialTheme.typography.bodyLarge,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    pages.indices.forEach { index ->
                        val selected = index == pagerState.currentPage
                        val dotWidth by animateDpAsState(
                            targetValue = if (selected) 24.dp else 8.dp,
                            label = "dotWidth"
                        )
                        val dotColor by animateColorAsState(
                            targetValue = if (selected) Primary else Border,
                            label = "dotColor"
                        )

                        Box(
                            modifier = Modifier
                                .padding(end = 6.dp)
                                .width(dotWidth)
                                .height(8.dp)
                                .clip(CircleShape)
                                .background(dotColor)
                        )
                    }
                }

                Button(
                    onClick = {
                        if (isLast) {
                            onFinished()
                        } else {
                            scope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        }
                    },
                    modifier = Modifier
                        .width(buttonWidth)
                        .height(56.dp),
                    shape = CircleShape,
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary,
                        contentColor = Color.White
                    )
                ) {
                    if (isLast) {
                        Text(
                            text = "Get started",
                            style = MaterialTheme.typography.labelLarge,
                            maxLines = 1
                        )
                    } else {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Next",
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }
    }
}
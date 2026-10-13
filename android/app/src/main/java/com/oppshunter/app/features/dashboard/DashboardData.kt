package com.oppshunter.app.features.dashboard

enum class OpportunityType(val label: String) {
    JOB("Job"),
    INTERNSHIP("Internship"),
    GRANT("Grant"),
    SCHOLARSHIP("Scholarship"),
    FELLOWSHIP("Fellowship")
}

enum class OpportunityFilter(val label: String, val type: OpportunityType?) {
    ALL("All", null),
    JOBS("Jobs", OpportunityType.JOB),
    INTERNSHIPS("Internships", OpportunityType.INTERNSHIP),
    GRANTS("Grants", OpportunityType.GRANT),
    SCHOLARSHIPS("Scholarships", OpportunityType.SCHOLARSHIP),
    FELLOWSHIPS("Fellowships", OpportunityType.FELLOWSHIP)
}

data class Opportunity(
    val id: String,
    val title: String,
    val organization: String,
    val location: String,
    val type: OpportunityType,
    val daysLeft: Int
) {
    val isUrgent: Boolean
        get() = daysLeft <= 3

    val deadlineLabel: String
        get() = when (daysLeft) {
            0 -> "Closes today"
            1 -> "1 day left"
            else -> "$daysLeft days left"
        }
}

object DashboardSampleData {
    val opportunities = listOf(
        Opportunity(
            id = "1",
            title = "Junior Product Designer",
            organization = "Northwind Labs",
            location = "Remote",
            type = OpportunityType.JOB,
            daysLeft = 3
        ),
        Opportunity(
            id = "2",
            title = "Software Engineering Intern",
            organization = "Helio Systems",
            location = "London, UK",
            type = OpportunityType.INTERNSHIP,
            daysLeft = 5
        ),
        Opportunity(
            id = "3",
            title = "Women in Tech Grant",
            organization = "Meridian Fund",
            location = "Global",
            type = OpportunityType.GRANT,
            daysLeft = 12
        ),
        Opportunity(
            id = "4",
            title = "Master's Scholarship 2027",
            organization = "Brightpath Foundation",
            location = "United Kingdom",
            type = OpportunityType.SCHOLARSHIP,
            daysLeft = 20
        ),
        Opportunity(
            id = "5",
            title = "Applied Research Fellowship",
            organization = "Atlas Institute",
            location = "Berlin, DE",
            type = OpportunityType.FELLOWSHIP,
            daysLeft = 9
        ),
        Opportunity(
            id = "6",
            title = "Data Analyst",
            organization = "Kite Analytics",
            location = "Remote",
            type = OpportunityType.JOB,
            daysLeft = 7
        )
    )
}
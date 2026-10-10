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
    val matchPercent: Int,
    val deadline: String
)

object DashboardSampleData {
    val opportunities = listOf(
        Opportunity(
            id = "1",
            title = "Junior Product Designer",
            organization = "Northwind Labs",
            location = "Remote",
            type = OpportunityType.JOB,
            matchPercent = 94,
            deadline = "3 days left"
        ),
        Opportunity(
            id = "2",
            title = "Software Engineering Intern",
            organization = "Helio Systems",
            location = "London, UK",
            type = OpportunityType.INTERNSHIP,
            matchPercent = 91,
            deadline = "5 days left"
        ),
        Opportunity(
            id = "3",
            title = "Women in Tech Grant",
            organization = "Meridian Fund",
            location = "Global",
            type = OpportunityType.GRANT,
            matchPercent = 88,
            deadline = "12 days left"
        ),
        Opportunity(
            id = "4",
            title = "Master's Scholarship 2027",
            organization = "Brightpath Foundation",
            location = "United Kingdom",
            type = OpportunityType.SCHOLARSHIP,
            matchPercent = 85,
            deadline = "20 days left"
        ),
        Opportunity(
            id = "5",
            title = "Applied Research Fellowship",
            organization = "Atlas Institute",
            location = "Berlin, DE",
            type = OpportunityType.FELLOWSHIP,
            matchPercent = 82,
            deadline = "9 days left"
        ),
        Opportunity(
            id = "6",
            title = "Data Analyst",
            organization = "Kite Analytics",
            location = "Remote",
            type = OpportunityType.JOB,
            matchPercent = 80,
            deadline = "7 days left"
        )
    )
}
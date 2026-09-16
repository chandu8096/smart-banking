package smartbanking.dto;

public class AdminDashboardResponse {

    private long totalUsers;
    private long totalAccounts;
    private long totalTransactions;
    private long suspiciousTransactions;
    private long rejectedTransactions;
    private long successfulTransactions;

    public AdminDashboardResponse(
            long totalUsers,
            long totalAccounts,
            long totalTransactions,
            long suspiciousTransactions,
            long rejectedTransactions,
            long successfulTransactions) {

        this.totalUsers = totalUsers;
        this.totalAccounts = totalAccounts;
        this.totalTransactions = totalTransactions;
        this.suspiciousTransactions = suspiciousTransactions;
        this.rejectedTransactions = rejectedTransactions;
        this.successfulTransactions = successfulTransactions;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getTotalAccounts() {
        return totalAccounts;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public long getSuspiciousTransactions() {
        return suspiciousTransactions;
    }

    public long getRejectedTransactions() {
        return rejectedTransactions;
    }

    public long getSuccessfulTransactions() {
        return successfulTransactions;
    }
}
package smartbanking.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "TRANSACTIONS")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TRANSACTION_ID")
    private Long transactionId;

    @Column(name = "FROM_ACCOUNT")
    private Long fromAccount;

    @Column(name = "TO_ACCOUNT")
    private Long toAccount;

    @Column(name = "AMOUNT", nullable = false)
    private BigDecimal amount;

    @Column(name = "TRANSACTION_TYPE")
    private String transactionType;

    @Column(name = "TRANSACTION_DATE")
    private LocalDateTime transactionDate;

    @Column(name = "STATUS")
    private String status = "SUCCESS";

    @Column(name = "IS_SUSPICIOUS")
    private Integer isSuspicious = 0;

    @Column(name = "FRAUD_REASON")
    private String fraudReason;

    public Transaction() {
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getFromAccount() {
        return fromAccount;
    }

    public void setFromAccount(Long fromAccount) {
        this.fromAccount = fromAccount;
    }

    public Long getToAccount() {
        return toAccount;
    }

    public void setToAccount(Long toAccount) {
        this.toAccount = toAccount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getIsSuspicious() {
        return isSuspicious;
    }

    public void setIsSuspicious(Integer isSuspicious) {
        this.isSuspicious = isSuspicious;
    }
    public String getFraudReason() {
    return fraudReason;
}

public void setFraudReason(String fraudReason) {
    this.fraudReason = fraudReason;
}
}

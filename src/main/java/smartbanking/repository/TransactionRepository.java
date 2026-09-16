package smartbanking.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import smartbanking.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query(value = """
            SELECT COUNT(*)
            FROM TRANSACTIONS
            WHERE FROM_ACCOUNT = :fromAccount
              AND TRANSACTION_DATE >= :cutoff
            """, nativeQuery = true)
    long countRecentTransactions(
            @Param("fromAccount") Long fromAccount,
            @Param("cutoff") LocalDateTime cutoff);

    @Query(value = """
            SELECT COALESCE(AVG(AMOUNT), 0)
            FROM TRANSACTIONS
            WHERE FROM_ACCOUNT = :fromAccount
            """, nativeQuery = true)
    BigDecimal findAverageTransactionAmount(
            @Param("fromAccount") Long fromAccount);

    @Query(value = """
            SELECT *
            FROM TRANSACTIONS
            WHERE IS_SUSPICIOUS = 1
              AND STATUS = 'SUSPICIOUS'
            ORDER BY TRANSACTION_DATE DESC
            """, nativeQuery = true)
    List<Transaction> findSuspiciousTransactions();

    long countByStatus(String status);

long countByIsSuspicious(Integer isSuspicious);

long countByStatusAndIsSuspicious(String status, Integer isSuspicious);

@Query(value = """
        SELECT *
        FROM TRANSACTIONS
        WHERE FROM_ACCOUNT IN (
            SELECT ACCOUNT_ID
            FROM ACCOUNTS
            WHERE USER_ID = :userId
        )
        OR TO_ACCOUNT IN (
            SELECT ACCOUNT_ID
            FROM ACCOUNTS
            WHERE USER_ID = :userId
        )
        ORDER BY TRANSACTION_DATE DESC
        """, nativeQuery = true)
List<Transaction> findTransactionsByUserId(
        @Param("userId") Long userId); 

   }
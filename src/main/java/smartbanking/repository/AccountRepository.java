package smartbanking.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import smartbanking.entity.Account;

public interface AccountRepository extends JpaRepository<Account, Long> {

    boolean existsByAccountIdAndUserId(Long accountId, Long userId);

    List<Account> findByUserId(Long userId);

    long count();
}
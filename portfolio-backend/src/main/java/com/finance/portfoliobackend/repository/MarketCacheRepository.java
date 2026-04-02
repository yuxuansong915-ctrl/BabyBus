package com.finance.portfoliobackend.repository;

import com.finance.portfoliobackend.model.MarketCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketCacheRepository extends JpaRepository<MarketCache, String> {
    List<MarketCache> findByTickerIn(List<String> tickers);
}

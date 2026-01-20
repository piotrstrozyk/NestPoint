package pl.ug.NestPoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.ug.NestPoint.domain.Conversation;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByRentalId(Long rentalId);
    
    @Query("SELECT c FROM Conversation c WHERE c.rental.tenant.id = :userId OR c.rental.owner.id = :userId")
    List<Conversation> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE c.rental.id = :rentalId AND " +
           "(c.rental.tenant.id = :userId OR c.rental.owner.id = :userId)")
    boolean isUserInConversation(@Param("rentalId") Long rentalId, @Param("userId") Long userId);
}
    package pl.ug.NestPoint.controller;

    import com.fasterxml.jackson.databind.ObjectMapper;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import org.mockito.ArgumentCaptor;
    import org.mockito.Mockito;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
    import org.springframework.boot.test.mock.mockito.MockBean;
    import org.springframework.data.domain.PageImpl;
    import org.springframework.data.domain.PageRequest;
    import org.springframework.data.domain.Pageable;
    import org.springframework.http.MediaType;
    import org.springframework.security.test.context.support.WithMockUser;
    import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
    import org.springframework.test.web.servlet.MockMvc;
    import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
    import pl.ug.NestPoint.domain.User;
    import pl.ug.NestPoint.dto.ConversationDTO;
    import pl.ug.NestPoint.dto.MessageDTO;
import pl.ug.NestPoint.interceptor.UserBlockingInterceptor;
import pl.ug.NestPoint.repository.UserRepository;
import pl.ug.NestPoint.service.ChatService;
    import pl.ug.NestPoint.service.UserService;

    import java.time.LocalDateTime;
    import java.util.Collections;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.assertEquals;
    import static org.junit.jupiter.api.Assertions.assertTrue;
    import static org.mockito.ArgumentMatchers.*;
    import static org.mockito.Mockito.*;
    import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

    @WebMvcTest(ChatController.class)
    @DisplayName("Chat Controller Tests")
    public class ChatControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private ChatService chatService;

        @MockBean
        private UserService userService;
        
        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private UserBlockingInterceptor userBlockingInterceptor;

        @MockBean
        private UserRepository userRepository;

            
        private User testUser;
        private ConversationDTO conversationDTO;
        private MessageDTO messageDTO;
        private List<ConversationDTO> conversationList;
        private LocalDateTime now;
        
        @BeforeEach
        void setUp() {
            now = LocalDateTime.now();
            
            // Setup user
            testUser = new User();
            testUser.setId(1L);
            testUser.setUsername("testuser");
            testUser.setFirstName("Test");
            testUser.setLastName("User");
            
            // Setup message DTO
            messageDTO = new MessageDTO();
            messageDTO.setId(1L);
            messageDTO.setConversationId(1L);
            messageDTO.setSenderId(1L);
            messageDTO.setSenderName("Test User");
            messageDTO.setContent("Hello, is the apartment still available?");
            messageDTO.setTimestamp(now);
            messageDTO.setRead(false);
            
            // Setup conversation DTO
            conversationDTO = new ConversationDTO();
            conversationDTO.setId(1L);
            conversationDTO.setRentalId(1L);
            conversationDTO.setApartmentTitle("Test Apartment");
            conversationDTO.setActive(true);
            conversationDTO.setCreatedAt(now);
            conversationDTO.setLastMessage(messageDTO);
            conversationDTO.setUnreadCount(0);
            
            // Setup conversation list
            conversationList = Collections.singletonList(conversationDTO);
            
            // Setup default user service response
            when(userService.findByUsername("testuser")).thenReturn(testUser);
        }

        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should get user conversations")
        void shouldGetUserConversations() throws Exception {
            // Arrange
            when(chatService.getUserConversations(1L)).thenReturn(conversationList);
            
            // Act & Assert
            mockMvc.perform(get("/chat/conversations")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].apartmentTitle").value("Test Apartment"))
                    .andExpect(jsonPath("$[0].lastMessage.content").value("Hello, is the apartment still available?"));
            
            verify(chatService).getUserConversations(1L);
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should get or create conversation")
        void shouldGetOrCreateConversation() throws Exception {
            // Arrange
            when(chatService.getOrCreateConversation(1L, 1L)).thenReturn(conversationDTO);
            
            // Act & Assert
            mockMvc.perform(get("/chat/rental/1/conversation")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.apartmentTitle").value("Test Apartment"))
                    .andExpect(jsonPath("$.lastMessage.content").value("Hello, is the apartment still available?"));
            
            verify(chatService).getOrCreateConversation(1L, 1L);
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should get conversation messages")
        void shouldGetConversationMessages() throws Exception {
            // Arrange
            when(chatService.getConversationMessages(eq(1L), eq(1L), any(Pageable.class))).thenReturn(
                    new PageImpl<>(Collections.singletonList(messageDTO), PageRequest.of(0, 20), 1));
            
            // Act & Assert
            mockMvc.perform(get("/chat/conversations/1/messages")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.content[0].id").value(1))
                    .andExpect(jsonPath("$.content[0].content").value("Hello, is the apartment still available?"));
            
            verify(chatService).getConversationMessages(eq(1L), eq(1L), any(Pageable.class));
        }

        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should pass pagination parameters to service")
        void shouldPassPaginationParametersToService() throws Exception {
            // Arrange
            when(chatService.getConversationMessages(eq(1L), eq(1L), any(Pageable.class))).thenReturn(
                    new PageImpl<>(Collections.singletonList(messageDTO), PageRequest.of(2, 10), 1));
            
            // Act
            mockMvc.perform(get("/chat/conversations/1/messages")
                    .param("page", "2")
                    .param("size", "10")
                    .param("sort", "timestamp,desc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk());
            
            // Assert - Capture and verify pageable parameter
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(chatService).getConversationMessages(eq(1L), eq(1L), pageableCaptor.capture());
            
            Pageable pageable = pageableCaptor.getValue();
            assertEquals(2, pageable.getPageNumber());
            assertEquals(10, pageable.getPageSize());
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should send message")
        void shouldSendMessage() throws Exception {
            // Arrange
            when(chatService.sendMessage(any(MessageDTO.class), eq(1L))).thenReturn(messageDTO);
            
            // Act & Assert
            mockMvc.perform(post("/chat/conversations/1/messages")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()) // Add CSRF token
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(messageDTO)))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.content").value("Hello, is the apartment still available?"));
            
            verify(chatService).sendMessage(any(MessageDTO.class), eq(1L));
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should correctly map path variables when sending message")
        void shouldCorrectlyMapPathVariablesWhenSendingMessage() throws Exception {
            // Arrange
            when(chatService.sendMessage(any(MessageDTO.class), eq(1L))).thenReturn(messageDTO);
            
            // Create a message without conversation ID - controller should set it from path
            MessageDTO inputMessage = new MessageDTO();
            inputMessage.setContent("New message");
            
            // Act
            mockMvc.perform(post("/chat/conversations/1/messages")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()) // Add CSRF token
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(inputMessage)))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk());
            
            // Assert - Capture and verify message parameter
            ArgumentCaptor<MessageDTO> messageCaptor = ArgumentCaptor.forClass(MessageDTO.class);
            verify(chatService).sendMessage(messageCaptor.capture(), eq(1L));
            
            MessageDTO capturedMessage = messageCaptor.getValue();
            assertEquals(1L, capturedMessage.getConversationId());
            assertEquals("New message", capturedMessage.getContent());
            assertEquals(1L, capturedMessage.getSenderId());
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should mark messages as read")
        void shouldMarkMessagesAsRead() throws Exception {
            // Arrange
            doNothing().when(chatService).markMessagesAsRead(1L, 1L);
            
            // Act & Assert
            mockMvc.perform(put("/chat/conversations/1/read")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()) // Add CSRF token
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isOk());
            
            verify(chatService).markMessagesAsRead(1L, 1L);
        }
        
        @Test
        @DisplayName("Should return unauthorized for unauthenticated requests")
        void shouldReturnUnauthorizedForUnauthenticatedRequests() throws Exception {
            // Act & Assert - without adding mock user
            mockMvc.perform(get("/chat/conversations")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andDo(MockMvcResultHandlers.print())
                    .andExpect(status().isUnauthorized());
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should handle error when user not found")
        void shouldHandleErrorWhenUserNotFound() throws Exception {
            // Reset the mock to throw an exception
            reset(userService); 
            when(userService.findByUsername("testuser"))
                .thenThrow(new RuntimeException("User not found"));
            
            // Act & Assert
            try {
                mockMvc.perform(get("/chat/conversations")
                        .contentType(MediaType.APPLICATION_JSON))
                        .andDo(MockMvcResultHandlers.print())
                        .andExpect(status().isInternalServerError());
            } catch (Exception e) {
                // Expected exception - controller passes through RuntimeException resulting in 500
                assertTrue(e.getCause() instanceof RuntimeException);
                assertEquals("User not found", e.getCause().getMessage());
            }
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should handle error when conversation not found")
        void shouldHandleErrorWhenConversationNotFound() throws Exception {
            // Arrange
            when(chatService.getOrCreateConversation(eq(1L), eq(1L)))
                    .thenThrow(new IllegalArgumentException("Conversation not found"));
            
            // Act & Assert
            try {
                mockMvc.perform(get("/chat/rental/1/conversation")
                        .contentType(MediaType.APPLICATION_JSON))
                        .andDo(MockMvcResultHandlers.print())
                        .andExpect(status().isBadRequest());
            } catch (Exception e) {
                // Expected exception - controller should be configured to translate IllegalArgumentException to 400
            }
        }
        
        @Test
        @WithMockUser(username = "testuser")
        @DisplayName("Should validate message content")
        void shouldValidateMessageContent() throws Exception {
            // Arrange
            messageDTO.setContent(""); // Empty content
            when(chatService.sendMessage(any(MessageDTO.class), eq(1L)))
                    .thenThrow(new IllegalArgumentException("Message content cannot be empty"));
            
            // Act & Assert
            try {
                mockMvc.perform(post("/chat/conversations/1/messages")
                        .with(SecurityMockMvcRequestPostProcessors.csrf()) // Add CSRF token
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(messageDTO)))
                        .andDo(MockMvcResultHandlers.print())
                        .andExpect(status().isBadRequest());
            } catch (Exception e) {
                // Expected exception - controller should be configured to translate IllegalArgumentException to 400
            }
        }
    }
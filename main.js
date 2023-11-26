document.getElementById("loginForm").addEventListener("submit", loginUser);

async function getToken() {
    return localStorage.getItem('token');
}

async function checkToken() {
    const token = await getToken();

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour récupérer les données.");
        return false;
    }

    return true;
}

async function loginUser(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch("http://localhost:5000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Connexion réussie:", data);

            // Assurez-vous que la propriété 'token' existe dans la réponse
            if (data.token) {
                console.log("Token reçu lors de la connexion:", data.token);

                // Stockez le token dans une variable
                const token = data.token;

                // Stockez le token dans le stockage local
                localStorage.setItem("token", token);

                // Utilisez le token comme nécessaire
                // ...

                // Directement passer true à activateHomeTab si la connexion réussie
                activateHomeTab(data.user, true);

                // Appelez fetchData pour récupérer les données des posts après la connexion réussie
                fetchData().then((data) => {
                    if (data) {
                        displayPosts(data);
                    }
                });
            } else {
                console.error("Token manquant dans la réponse.");
            }
        } else {
            const data = await response.json();
            console.error("Erreur lors de la connexion:", data.message);
            $("#loginErrorModalBody").text(data.message);
            $("#loginErrorModal").modal("show");

            // Directement passer false à activateHomeTab si la connexion échoue
            activateHomeTab(null, false);
        }
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
    }
}

function activateHomeTab(userInfo, isLoggedIn) {
    const homeTab = document.getElementById("homeTab");
    homeTab.classList.add("active");

    // Afficher le contenu de l'onglet "Accueil"
    const homeTabContent = document.getElementById("home");
    homeTabContent.classList.add("show", "active");

    // Masquer les autres onglets
    const loginTabContent = document.getElementById("login");
    loginTabContent.classList.remove("show", "active");

    const registerTabContent = document.getElementById("register");
    registerTabContent.classList.remove("show", "active");


    // Afficher les informations de l'utilisateur connecté
    if (isLoggedIn && userInfo && userInfo.username) {
        const loggedInUserInfo = document.getElementById("loggedInUserInfo");
        loggedInUserInfo.innerHTML = `
            <h3>Bienvenue, ${userInfo.username} ! n'hesite pas a dire des truk!</h3>
            <!-- Vous pouvez ajouter d'autres informations de l'utilisateur ici -->
            <div id="postContainer"></div>
        `;

         // Créez et ajoutez le formulaire ici
         const newPostForm = document.createElement("form");
         newPostForm.classList.add("mb-3");
         newPostForm.innerHTML = `
             <div class="form-group">
                 <textarea class="form-control" rows="2" id="newPostMessage" placeholder="Écrire un nouveau post"></textarea>
             </div>
             <button type="button" class="btn btn-primary" id="postButton">Poster</button>
         `;
         loggedInUserInfo.appendChild(newPostForm);
 
         // Ajoutez l'écouteur d'événement
         const postButton = document.getElementById("postButton");
         if (postButton) {
             postButton.addEventListener("click", addPost);
         }
        // Utilisez la fonction displayPosts pour afficher les posts
       // fetchData().then((data) => {
        //    displayPosts(data);
      //  });
    }
    const logoutTab = document.getElementById("logoutTab");
    logoutTab.style.display = isLoggedIn ? "block" : "none";
}


document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = false;
    
    if (isLoggedIn) {
        // Affichez le bouton de déconnexion
        document.getElementById("logoutTab").style.display = "block";
    } else {
        // Cachez le bouton de déconnexion
        document.getElementById("logoutTab").style.display = "none";
    }
});


async function logout() {
    try {
        const response = await fetch("http://localhost:5000/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            // Effacez le token côté client
            localStorage.removeItem('token');

            // Redirigez l'utilisateur vers la page de connexion ou effectuez d'autres actions après la déconnexion
            window.location.href = "/login";
        } else {
            console.error("Erreur lors de la déconnexion :", response.statusText);
        }
    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
    }
}

// Associez l'événement de déconnexion au bouton correspondant
document.getElementById("logoutTab").addEventListener("click", logout);


//post function 

async function fetchData() {
    try {
        if (!(await checkToken())) {
            return;
        }

        const token = await getToken();
        console.log("Token value:", token);
        console.log("Fetching data...");

        const response = await fetch("http://localhost:5000/post", {
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("API Response:", response);

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Erreur d'authentification. Vérifiez le token.");
            } else {
                console.error("Erreur lors de la récupération des données:", response.statusText);
            }
            return;
        }

        const data = await response.json();

        // Retourner les données des posts plutôt que de stocker dans une variable globale
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
    }
}

async function addPost(event) {
    event.preventDefault();

    const messageInput = document.getElementById("newPostMessage");
    const message = messageInput.value;

    if (!(await checkToken())) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const token = await getToken();
        const response = await fetch("http://localhost:5000/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
            },
            body: JSON.stringify({
                message,
            }),
        });

        const newPost = await response.json();

        // Utiliser la fonction fetchData pour obtenir les données mises à jour des posts
        fetchData().then((data) => {
            displayPosts(data);
        });

        // Effacer le champ du formulaire
        messageInput.value = "";
    } catch (error) {
        console.error("Erreur lors de l'ajout du post:", error);
    }
}

async function likePost(postId) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour aimer un post.");
        return;
    }

    try {
        // Décoder le token JWT pour récupérer l'ID de l'utilisateur
        const decodedToken = jwt_decode(token);
        const userId = decodedToken.sub;

        const response = await fetch(
            `http://localhost:5000/post/like-post/${postId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
                body: JSON.stringify({ userId }),
            }
        );

        const updatedPost = await response.json();
        console.log("Post liked:", updatedPost);

        // Mettez à jour votre interface utilisateur en conséquence
        displayPosts([updatedPost]); // Mettez à jour le post existant
    } catch (error) {
        console.error("Erreur lors du like du post:", error);
    }
}

const newPostForm = document.createElement("form");
newPostForm.classList.add("mb-3");
newPostForm.innerHTML = `
    <div class="form-group">
        <textarea class="form-control" rows="2" id="newPostMessage" placeholder="Écrire un nouveau post"></textarea>
    </div>
    <button type="button" class="btn btn-primary" id="postButton">Poster</button>
`;

// Ajouter le formulaire au conteneur des posts une seule fois
const postContainer = document.getElementById("postContainer");
postContainer.appendChild(newPostForm);

// Ajouter l'écouteur d'événement en dehors de la fonction
const postButton = document.getElementById("postButton");
if (postButton) {
    postButton.addEventListener("click", addPost);
}

async function displayPosts(posts) {
    const postContainer = document.getElementById("postContainer");

    posts.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.classList.add("col-md-8", "offset-md-2", "mb-3");

        postElement.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <p class="card-text">${post.message}</p>
                    <p class="card-text">
                        <small class="text-muted">${post.author}</small></br>
                        <small class="text-muted">${post.createdAt}</small></br>
                        <small class="text-muted-likers likers">Liked by: ${post.likers.map(liker => liker.username).join(', ')}</small>
                    </p>
                    <button class="btn btn-primary like-button" data-post-id="${post._id}">Like</button>
                </div>
                
                <!-- Ajout du formulaire de commentaire -->
                <form class="card-footer">
                    <div class="form-group">
                        <textarea class="form-control" rows="1" placeholder="Commenter"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Comment'</button>
                </form>
            </div>
        `;

        postContainer.appendChild(postElement);

        const likeButton = postElement.querySelector(".like-button");
        if (likeButton) {
            likeButton.addEventListener("click", async () => {
                const postId = likeButton.getAttribute("data-post-id");
                await likePost(postId);
            });
        }

        // Afficher les noms d'utilisateur des likers
        const likersElement = postElement.querySelector(".text-muted-likers");
        console.log("Likers data:", post.likers);
        likersElement.innerHTML = post.likers.map(liker => liker.username).join(', ');
    });
}

async function getLikersUsernames(likers) {
    const token = await getToken();
    console.log("Token value:", token);

    if (!token) {
        console.error("Token d'utilisateur manquant. L'utilisateur doit être connecté pour récupérer les likers.");
        return '';
    }

    try {
        const response = await fetch("http://localhost:5000/user/usernames", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
            },
            body: JSON.stringify({
                userIds: likers,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erreur lors de la récupération des noms d'utilisateur des likers:", data.message);
            return '';
        }

        return data.usernames.join(', ');
    } catch (error) {
        console.error("Erreur lors de la récupération des noms d'utilisateur des likers:", error);
        return '';
    }
}

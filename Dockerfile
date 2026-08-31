FROM nginx:alpine
COPY index.html todo.html style.css auth.css script.js auth.js supabaseClient.js /usr/share/nginx/html/
COPY images /usr/share/nginx/html/images
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

---
title: "Home"
layout: archive
permalink: /
lang: en
---

<link rel="stylesheet" href="/assets/css/paginator.css">
<link rel="stylesheet" href="/assets/css/post-meta.css">
<link rel="stylesheet" href="/assets/css/home.css">

<h2 class='archive-subtitle'>{{ site.data.ui-text[site.active_lang].recent_posts | default: "Recent Posts" }}</h2>
{% assign posts = site.posts %}
{% include paginator.html %}

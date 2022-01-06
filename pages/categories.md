---
title: "Categories"
layout: archive
permalink: /categories
lang: en
---

<link rel="stylesheet" href="/assets/css/paginator.css">
<link rel="stylesheet" href="/assets/css/post-meta.css">

{% assign words = site.categories %}
{% include word-cloud.html %}

<ul>
  {% for category in site.categories %}
  <li>
    <h2 id='{{ category[0] | slugify }}' class='archive-subtitle'>{{category[0]}}</h2>
    {% assign posts = category[1] %}
    {% include paginator.html %}
  </li>
  {% endfor %}
</ul>

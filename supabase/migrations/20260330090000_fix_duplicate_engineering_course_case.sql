begin;

update public.app_projects
set course = 'Engenharia da complexidade'
where course = 'Engenharia da Complexidade';

delete from public.app_project_courses
where name = 'Engenharia da Complexidade';

commit;